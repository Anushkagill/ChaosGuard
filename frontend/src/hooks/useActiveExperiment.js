// ============================================================
// useActiveExperiment Hook — Phase 9 (SSE-driven)
// ============================================================
//
// Manages active running/queued experiment state via real-time SSE push.
//
// Architecture & Guarantees:
// 1. Zero Network Polling:
//    Replaces the previous 1s interval polling loop with native SSE event
//    subscriptions.
// 2. Authoritative Initial Fetch & Reconnection Recovery:
//    On mount and upon SSE reconnection, queries GET /experiments to
//    synchronize current state. Stale fetch responses are prevented from
//    overwriting newer SSE state via timestamp reconciliation.
// 3. Local Countdown:
//    When an experiment is RUNNING, a local tick interval computes countdown
//    seconds and progress percentage in-memory from startedAt and duration.
// 4. Reconnection Behavior:
//    Native EventSource handles automatic reconnection. Upon reconnect,
//    an authoritative snapshot fetch restores current state. Transient events
//    missed during disconnection are not replayed; state correctness is
//    guaranteed via the snapshot.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { listExperiments, stopExperiment } from '../api/experiments';
import { useSSE } from './useSSE';

export function useActiveExperiment(experimentsOrOptions = {}, maybeOnFinished, maybeOnLog) {
  const options = Array.isArray(experimentsOrOptions) ? {} : experimentsOrOptions;
  const onFinished = options.onFinished || options.onCompleted || maybeOnFinished;
  const onFailed = options.onFailed;
  const onLog = options.onLog || maybeOnLog;

  const [activeExp, setActiveExp] = useState(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const lastSseUpdateRef = useRef(0);
  const activeExpRef = useRef(null);
  activeExpRef.current = activeExp;

  const { subscribe, onReconnect } = useSSE();

  // Stop active experiment handler
  const stopActive = useCallback(async () => {
    if (!activeExpRef.current?.id) return;
    return await stopExperiment(activeExpRef.current.id);
  }, []);

  // Fetch current authoritative snapshot from API (reconciliation)
  const fetchAuthoritativeSnapshot = useCallback(async () => {
    const fetchInitiatedAt = Date.now();
    try {
      const list = await listExperiments();
      // If a newer SSE event was processed while this fetch was in-flight, discard stale snapshot
      if (lastSseUpdateRef.current > fetchInitiatedAt) {
        return;
      }

      const active = list.find((e) => ['QUEUED', 'RUNNING'].includes(e.status));
      if (active) {
        setActiveExp(active);
      } else if (activeExpRef.current && ['QUEUED', 'RUNNING'].includes(activeExpRef.current.status)) {
        // If snapshot has no active experiment but we had one, it finished while disconnected
        const previousId = activeExpRef.current.id;
        const resolved = list.find((e) => e.id === previousId);
        if (resolved) {
          setActiveExp(resolved);
          if (resolved.status === 'COMPLETED' && onFinished) onFinished(resolved);
          if (resolved.status === 'FAILED' && onFailed) onFailed(resolved);
        } else {
          setActiveExp(null);
        }
      }
    } catch (err) {
      console.warn('[useActiveExperiment] Error fetching authoritative snapshot:', err.message);
    }
  }, [onFinished, onFailed]);

  // Wire SSE event subscriptions and reconnection listener
  useEffect(() => {
    // 1. Subscribe to SSE events
    const unsubQueued = subscribe('experiment_queued', (data) => {
      lastSseUpdateRef.current = Date.now();
      const exp = {
        id: data.experimentId,
        target: data.target,
        fault: data.fault,
        parameters: data.parameters || {},
        duration: data.duration || 10,
        status: 'QUEUED',
        jobId: data.jobId,
        queuedAt: data.queuedAt || data.timestamp,
        startedAt: null,
        completedAt: null,
      };
      setActiveExp(exp);
      setRemainingSec(exp.duration);
      setProgressPercent(0);
      if (onLog) {
        onLog('QUEUED', `Experiment ${data.experimentId} queued via BullMQ worker.`);
      }
    });

    const unsubStarted = subscribe('experiment_started', (data) => {
      lastSseUpdateRef.current = Date.now();
      setActiveExp((prev) => {
        const base = prev?.id === data.experimentId ? prev : {};
        return {
          ...base,
          id: data.experimentId,
          target: data.target,
          fault: data.fault,
          parameters: data.parameters || base.parameters || {},
          duration: data.duration || base.duration || 10,
          status: 'RUNNING',
          startedAt: data.startedAt || data.timestamp,
        };
      });
      if (onLog) {
        onLog('ACTIVE', `Experiment ${data.experimentId} started — worker executing on ${data.target}`);
      }
    });

    const unsubFaultInjected = subscribe('fault_injected', (data) => {
      lastSseUpdateRef.current = Date.now();
      setActiveExp((prev) => {
        if (prev?.id === data.experimentId) {
          return { ...prev, faultActivated: true };
        }
        return prev;
      });
      if (onLog) {
        onLog('ACTIVE', `Fault ${data.fault} successfully activated on ${data.target}`);
      }
    });

    const unsubFaultCleared = subscribe('fault_cleared', (data) => {
      lastSseUpdateRef.current = Date.now();
      setActiveExp((prev) => {
        if (prev?.id === data.experimentId) {
          return { ...prev, faultCleared: true };
        }
        return prev;
      });
      if (onLog) {
        onLog('CLEANUP', `Fault cleared from ${data.target}`);
      }
    });

    const unsubCompleted = subscribe('experiment_completed', (data) => {
      lastSseUpdateRef.current = Date.now();
      const updated = {
        ...(activeExpRef.current || {}),
        id: data.experimentId,
        target: data.target,
        status: 'COMPLETED',
        faultCleared: data.faultCleared,
        completedAt: data.completedAt || data.timestamp,
      };
      setActiveExp(updated);
      setRemainingSec(0);
      setProgressPercent(100);
      if (onLog) {
        onLog('CLEANUP', `Experiment ${data.experimentId} completed (faultCleared: ${data.faultCleared})`);
      }
      if (onFinished) {
        onFinished(updated);
      }
    });

    const unsubFailed = subscribe('experiment_failed', (data) => {
      lastSseUpdateRef.current = Date.now();
      const updated = {
        ...(activeExpRef.current || {}),
        id: data.experimentId,
        target: data.target,
        status: 'FAILED',
        error: data.error,
        faultCleared: data.faultCleared,
        completedAt: data.completedAt || data.timestamp,
      };
      setActiveExp(updated);
      setRemainingSec(0);
      if (onLog) {
        onLog('ERROR', `Experiment ${data.experimentId} failed: ${data.error}`);
      }
      if (onFailed) {
        onFailed(updated);
      }
    });

    // 2. Authoritative snapshot fetch on initial mount and upon SSE reconnection
    fetchAuthoritativeSnapshot();
    const unsubReconnect = onReconnect(() => {
      fetchAuthoritativeSnapshot();
    });

    return () => {
      unsubQueued();
      unsubStarted();
      unsubFaultInjected();
      unsubFaultCleared();
      unsubCompleted();
      unsubFailed();
      unsubReconnect();
    };
  }, [subscribe, onReconnect, fetchAuthoritativeSnapshot, onLog, onFinished, onFailed]);

  // Local ticker for countdown and progress calculation during RUNNING state (in-memory, no network)
  useEffect(() => {
    if (!activeExp || activeExp.status !== 'RUNNING' || !activeExp.startedAt) {
      if (!activeExp || ['COMPLETED', 'FAILED'].includes(activeExp.status)) {
        setRemainingSec(0);
        setProgressPercent(activeExp?.status === 'COMPLETED' ? 100 : 0);
      }
      return;
    }

    const duration = activeExp.duration || 10;
    const startedAt = new Date(activeExp.startedAt).getTime();

    const updateTimer = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rem = Math.max(0, Math.ceil(duration - elapsed));
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setRemainingSec(rem);
      setProgressPercent(pct);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 500);

    return () => clearInterval(timerId);
  }, [activeExp?.status, activeExp?.startedAt, activeExp?.duration]);

  return {
    activeExperiment: activeExp,
    remainingSec,
    countdown: remainingSec,
    progressPercent,
    progress: progressPercent,
    stopActiveExperiment: stopActive,
    refreshSnapshot: fetchAuthoritativeSnapshot,
  };
}

export default useActiveExperiment;
