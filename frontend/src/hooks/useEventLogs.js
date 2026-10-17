// ============================================================
// useEventLogs Hook — Phase 7
// ============================================================

import { useState, useCallback } from 'react';

const MAX_LOGS = 100;

export function useEventLogs() {
  const [logs, setLogs] = useState(() => [
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'ChaosGuard Dashboard connected to cluster runtime.',
    },
  ]);

  const addLog = useCallback((level, message) => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
      },
      ...prev.slice(0, MAX_LOGS - 1),
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
}

export default useEventLogs;
