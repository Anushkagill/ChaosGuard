// ============================================================
// useServices Hook — Phase 7
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchClusterOverview } from '../api/services';

export function useServices(options = {}) {
  const pollIntervalMs = typeof options === 'number' ? options : options.pollIntervalMs || 3000;
  const onStatusChange = typeof options === 'object' ? options.onStatusChange : null;

  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMounted = useRef(true);
  const previousFaultsRef = useRef({});

  const refresh = useCallback(async () => {
    try {
      const data = await fetchClusterOverview();
      if (isMounted.current) {
        setServices(data);
        setLastUpdated(new Date().toISOString());
        setLoading(false);

        // Detect fault state transitions if onStatusChange is provided
        if (onStatusChange) {
          Object.values(data).forEach((svc) => {
            const hadFault = previousFaultsRef.current[svc.id];
            const hasFault = Boolean(svc.activeFault);
            if (!hadFault && hasFault) {
              onStatusChange({
                type: 'fault_injected',
                serviceId: svc.id,
                message: `Active chaos fault (${svc.activeFault.fault}) detected on ${svc.name || svc.id}`,
              });
            } else if (hadFault && !hasFault) {
              onStatusChange({
                type: 'fault_cleared',
                serviceId: svc.id,
                message: `Fault cleared on ${svc.name || svc.id}. Service returned to nominal.`,
              });
            }
            previousFaultsRef.current[svc.id] = hasFault;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch cluster services overview:', err);
      if (isMounted.current) setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    isMounted.current = true;
    refresh();
    const interval = setInterval(refresh, pollIntervalMs);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [refresh, pollIntervalMs]);

  const serviceList = Object.values(services);
  const totalCount = serviceList.length;
  const healthyCount = serviceList.filter((s) => s.healthy && !s.activeFault).length;
  const faultCount = serviceList.filter((s) => s.activeFault).length;

  return {
    services,
    loading,
    isLoading: loading,
    lastUpdated,
    refresh,
    totalCount,
    healthyCount,
    faultCount,
  };
}

export default useServices;
