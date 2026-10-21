/**
 * ChaosGuard Propagation Analysis Utility — Phase 8
 * 
 * Computes failure propagation and health impact across the 4-microservice topology:
 * Sequential Pipeline: Order Orchestrator (:3001) -> Auth (:3003) -> Inventory (:3004) -> Payment (:3002)
 */

/**
 * Sequential order of execution for dependency calls made by Order Service
 */
export const PIPELINE_STEPS = [
  { step: 1, key: 'auth', serviceId: 'auth-service', label: 'Step 1: Auth' },
  { step: 2, key: 'inventory', serviceId: 'inventory-service', label: 'Step 2: Reserve' },
  { step: 3, key: 'payment', serviceId: 'payment-service', label: 'Step 3: Payment' },
];

/**
 * Computes propagation state for all nodes and edges in the topology.
 * 
 * Node propagation states:
 * - 'nominal': Healthy, operating as normal
 * - 'target': Direct target of injected chaos fault or active experiment
 * - 'affected': Service indirectly impacted (e.g. Order orchestrator failing a call)
 * - 'shielded': Downstream services unreached / protected because upstream call aborted
 * 
 * Edge states:
 * - 'healthy': Nominal green flow
 * - 'degraded': High latency / degraded amber flow
 * - 'failed': Broken / red error flow
 * - 'probing': Active blue pulse during probe
 * - 'inactive': Gray dashed unreached link (shielded)
 * 
 * @param {Object} services - Map of serviceId -> service data from useServices
 * @param {Object|null} activeExperiment - Active running experiment
 * @param {Object|null} probeStatus - Real-time probe execution status
 * @returns {{ nodes: Object.<string, string>, edges: Object.<string, string> }}
 */
export function computePropagation(services = {}, activeExperiment = null, probeStatus = null) {
  const nodeStates = {
    'auth-service': 'nominal',
    'order-service': 'nominal',
    'inventory-service': 'nominal',
    'payment-service': 'nominal',
  };

  const edgeStates = {
    'order-to-auth': 'healthy',
    'order-to-inventory': 'healthy',
    'order-to-payment': 'healthy',
  };

  // Determine active target service and fault type (from experiment OR manual fault)
  let activeTarget = null;
  let activeFaultType = null;

  const isExpActive =
    activeExperiment &&
    (activeExperiment.status === 'RUNNING' || activeExperiment.status === 'QUEUED');

  if (isExpActive) {
    activeTarget = activeExperiment.targetService;
    activeFaultType = activeExperiment.faultType;
  } else {
    // Check manual faults
    for (const [id, s] of Object.entries(services)) {
      if (s?.fault?.active) {
        activeTarget = id;
        activeFaultType = s.fault.type;
        break;
      }
    }
  }

  // 1. Compute Base Propagation based on Pipeline Order
  if (activeTarget) {
    // Target is directly marked
    nodeStates[activeTarget] = 'target';

    // The Order orchestrator is always affected if any dependency has a fault
    nodeStates['order-service'] = 'affected';

    if (activeTarget === 'auth-service') {
      // Step 1 failed/delayed:
      // If error or unavailable, pipeline aborts at Step 1 -> Inventory & Payment are shielded
      // If latency, pipeline is delayed across all steps
      if (activeFaultType === 'latency') {
        nodeStates['inventory-service'] = 'affected';
        nodeStates['payment-service'] = 'affected';
        edgeStates['order-to-auth'] = 'degraded';
        edgeStates['order-to-inventory'] = 'degraded';
        edgeStates['order-to-payment'] = 'degraded';
      } else {
        nodeStates['inventory-service'] = 'shielded';
        nodeStates['payment-service'] = 'shielded';
        edgeStates['order-to-auth'] = 'failed';
        edgeStates['order-to-inventory'] = 'inactive';
        edgeStates['order-to-payment'] = 'inactive';
      }
    } else if (activeTarget === 'inventory-service') {
      // Step 1 (Auth) succeeded -> nominal
      nodeStates['auth-service'] = 'nominal';
      edgeStates['order-to-auth'] = 'healthy';

      if (activeFaultType === 'latency') {
        nodeStates['payment-service'] = 'affected';
        edgeStates['order-to-inventory'] = 'degraded';
        edgeStates['order-to-payment'] = 'degraded';
      } else {
        // Step 2 (Inventory) failed -> Step 3 (Payment) never invoked (shielded)
        nodeStates['payment-service'] = 'shielded';
        edgeStates['order-to-inventory'] = 'failed';
        edgeStates['order-to-payment'] = 'inactive';
      }
    } else if (activeTarget === 'payment-service') {
      // Step 1 and Step 2 succeeded
      nodeStates['auth-service'] = 'nominal';
      nodeStates['inventory-service'] = 'nominal';
      edgeStates['order-to-auth'] = 'healthy';
      edgeStates['order-to-inventory'] = 'healthy';

      if (activeFaultType === 'latency') {
        edgeStates['order-to-payment'] = 'degraded';
      } else {
        edgeStates['order-to-payment'] = 'failed';
      }
    }
  } else {
    // No active experiment or single fault: check individual service statuses
    for (const [id, s] of Object.entries(services)) {
      if (s?.status === 'failed') {
        nodeStates[id] = 'target';
        nodeStates['order-service'] = 'affected';
      } else if (s?.status === 'degraded') {
        nodeStates[id] = 'target';
        nodeStates['order-service'] = 'affected';
      }
    }

    // Default edge states to target service health
    edgeStates['order-to-auth'] = getEdgeHealthState(services['auth-service']);
    edgeStates['order-to-inventory'] = getEdgeHealthState(services['inventory-service']);
    edgeStates['order-to-payment'] = getEdgeHealthState(services['payment-service']);
  }

  // 2. Overlay Live Probe Status (highest priority when probe is running or just finished)
  if (probeStatus?.isRunning) {
    const currentStep = probeStatus.currentStep; // 'auth' | 'inventory' | 'payment'

    if (currentStep === 'auth') {
      edgeStates['order-to-auth'] = 'probing';
    } else if (currentStep === 'inventory') {
      edgeStates['order-to-auth'] = probeStatus.steps?.auth?.success ? 'healthy' : 'failed';
      edgeStates['order-to-inventory'] = 'probing';
    } else if (currentStep === 'payment') {
      edgeStates['order-to-auth'] = probeStatus.steps?.auth?.success ? 'healthy' : 'failed';
      edgeStates['order-to-inventory'] = probeStatus.steps?.inventory?.success ? 'healthy' : 'failed';
      edgeStates['order-to-payment'] = 'probing';
    }
  } else if (probeStatus?.completed) {
    if (probeStatus.steps?.auth) {
      edgeStates['order-to-auth'] = probeStatus.steps.auth.success ? 'healthy' : 'failed';
    }
    if (probeStatus.steps?.inventory) {
      edgeStates['order-to-inventory'] = probeStatus.steps.inventory.success ? 'healthy' : 'failed';
    } else if (probeStatus.steps?.auth?.success === false) {
      edgeStates['order-to-inventory'] = 'inactive';
    }

    if (probeStatus.steps?.payment) {
      edgeStates['order-to-payment'] = probeStatus.steps.payment.success ? 'healthy' : 'failed';
    } else if (probeStatus.steps?.auth?.success === false || probeStatus.steps?.inventory?.success === false) {
      edgeStates['order-to-payment'] = 'inactive';
    }
  }

  return {
    nodes: nodeStates,
    edges: edgeStates,
    activeTarget,
    activeFaultType,
  };
}

function getEdgeHealthState(service) {
  if (!service) return 'healthy';
  if (service.status === 'failed' || (service.fault?.active && service.fault?.type !== 'latency')) {
    return 'failed';
  }
  if (service.status === 'degraded' || (service.fault?.active && service.fault?.type === 'latency')) {
    return 'degraded';
  }
  return 'healthy';
}
