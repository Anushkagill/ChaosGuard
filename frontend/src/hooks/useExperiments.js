// ============================================================
// useExperiments Hook — Phase 7
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  listExperiments,
  createExperiment as apiCreate,
  startExperiment as apiStart,
  stopExperiment as apiStop,
} from '../api/experiments';

export function useExperiments(options = {}) {
  const onLog = typeof options === 'function' ? options : options.onEvent || options.onLog;

  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchList = useCallback(async () => {
    try {
      const data = await listExperiments();
      if (isMounted.current) {
        // Sort newest first
        setExperiments([...data].reverse());
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to list experiments:', err);
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchList();
    const interval = setInterval(fetchList, 2500);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchList]);

  const create = useCallback(
    async (payload) => {
      try {
        const exp = await apiCreate(payload);
        if (onLog) onLog('INFO', `Created experiment ${exp.id} targeting ${exp.targetService || exp.target} (${exp.faultType || exp.fault})`);
        await fetchList();
        return exp;
      } catch (err) {
        if (onLog) onLog('ERROR', `Failed to create experiment: ${err.message}`);
        throw err;
      }
    },
    [fetchList, onLog]
  );

  const start = useCallback(
    async (id) => {
      try {
        const exp = await apiStart(id);
        if (onLog) onLog('ACTIVE', `Experiment ${id} started — enqueued to BullMQ`);
        await fetchList();
        return exp;
      } catch (err) {
        if (onLog) onLog('ERROR', `Failed to start experiment ${id}: ${err.message}`);
        throw err;
      }
    },
    [fetchList, onLog]
  );

  const stop = useCallback(
    async (id) => {
      try {
        const exp = await apiStop(id);
        if (onLog) onLog('CLEANUP', `Experiment ${id} stopped — target fault cleared`);
        await fetchList();
        return exp;
      } catch (err) {
        if (onLog) onLog('ERROR', `Failed to stop experiment ${id}: ${err.message}`);
        throw err;
      }
    },
    [fetchList, onLog]
  );

  return {
    experiments,
    loading,
    isLoading: loading,
    refresh: fetchList,
    fetchExperiments: fetchList,
    create,
    createExperiment: create,
    start,
    startExperiment: start,
    stop,
    stopExperiment: stop,
  };
}

export default useExperiments;
