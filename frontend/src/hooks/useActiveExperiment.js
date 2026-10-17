// ============================================================
// useActiveExperiment Hook — Phase 7
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { getExperiment, listExperiments, stopExperiment } from '../api/experiments';

export function useActiveExperiment(experimentsOrOptions = {}, maybeOnFinished, maybeOnLog) {
  let experiments = Array.isArray(experimentsOrOptions) ? experimentsOrOptions : experimentsOrOptions.experiments || null;
  const options = Array.isArray(experimentsOrOptions) ? {} : experimentsOrOptions;
  const onFinished = options.onFinished || options.onCompleted || maybeOnFinished;
  const onFailed = options.onFailed;
  const onLog = options.onLog || maybeOnLog;

  const [activeExp, setActiveExp] = useState(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const lastStateRef = useRef(null);

  // Stop active experiment handler
  const stopActive = useCallback(async () => {
    if (!activeExp?.id) return;
    return await stopExperiment(activeExp.id);
  }, [activeExp]);

  useEffect(() => {
    let isMounted = true;

    const checkActive = async () => {
      try {
        let active = null;
        if (experiments) {
          active = experiments.find((e) => ['QUEUED', 'RUNNING'].includes(e.status));
        } else {
          // Fetch from API directly if list was not passed
          const list = await listExperiments();
          active = list.find((e) => ['QUEUED', 'RUNNING'].includes(e.status));
        }

        if (!active) {
          if (lastStateRef.current && ['QUEUED', 'RUNNING'].includes(lastStateRef.current.status)) {
            if (lastStateRef.current.status === 'FAILED' && onFailed) {
              onFailed(lastStateRef.current);
            } else if (onFinished) {
              onFinished(lastStateRef.current);
            }
          }
          if (isMounted) {
            setActiveExp(null);
            setRemainingSec(0);
            setProgressPercent(0);
          }
          lastStateRef.current = null;
          return;
        }

        const latest = await getExperiment(active.id);
        if (!isMounted) return;

        setActiveExp(latest);

        if (latest.status === 'RUNNING' && latest.startedAt) {
          const startedAt = new Date(latest.startedAt).getTime();
          const duration = latest.duration || 10;
          const elapsed = (Date.now() - startedAt) / 1000;
          const rem = Math.max(0, Math.ceil(duration - elapsed));
          const pct = Math.min(100, Math.round((elapsed / duration) * 100));
          setRemainingSec(rem);
          setProgressPercent(pct);
        } else if (latest.status === 'QUEUED') {
          setRemainingSec(latest.duration || 10);
          setProgressPercent(0);
        }

        if (['COMPLETED', 'FAILED'].includes(latest.status)) {
          if (onLog) {
            onLog(
              latest.status === 'COMPLETED' ? 'CLEANUP' : 'ERROR',
              `Experiment ${latest.id} reached ${latest.status} (faultCleared: ${latest.faultCleared})`
            );
          }
          if (latest.status === 'FAILED' && onFailed) {
            onFailed(latest);
          } else if (onFinished) {
            onFinished(latest);
          }
        }

        lastStateRef.current = latest;
      } catch (err) {
        console.error('Error polling active experiment:', err);
      }
    };

    checkActive();
    const interval = setInterval(checkActive, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [experiments, onFinished, onFailed, onLog]);

  return {
    activeExperiment: activeExp,
    remainingSec,
    countdown: remainingSec,
    progressPercent,
    progress: progressPercent,
    stopActiveExperiment: stopActive,
  };
}

export default useActiveExperiment;
