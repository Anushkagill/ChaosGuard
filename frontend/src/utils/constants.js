// ============================================================
// ChaosGuard Dashboard Constants — Phase 7
// ============================================================

export const SERVICES = {
  'auth-service': {
    id: 'auth-service',
    name: 'auth-service',
    displayName: 'Auth Service',
    port: 3003,
    role: 'Simulated Gateway & Token Validation',
    description: 'Validates caller tokens before orders can be created. Upstream single point of failure.',
    basePath: '/api/auth',
    color: '#3B82F6',
    canTarget: true,
    dependencies: {
      upstream: [],
      downstream: ['order-service'],
    },
    endpoints: [
      { method: 'GET', path: '/health', desc: 'Liveness & service identity check' },
      { method: 'POST', path: '/auth/verify', desc: 'Validates token presence & validity' },
      { method: 'GET', path: '/internal/faults', desc: 'Inspects in-memory active fault' },
      { method: 'POST', path: '/internal/faults', desc: 'Injects chaos fault' },
      { method: 'DELETE', path: '/internal/faults', desc: 'Clears injected chaos fault' },
    ],
  },
  'order-service': {
    id: 'order-service',
    name: 'order-service',
    displayName: 'Order Service',
    port: 3001,
    role: 'Sequential Pipeline Orchestrator',
    description: 'Sequentially coordinates Auth (:3003) -> Inventory (:3004) -> Payment (:3002).',
    basePath: '/api/order',
    color: '#8B5CF6',
    canTarget: false, // Orchestrator, not a fault injection target
    dependencies: {
      upstream: ['auth-service', 'inventory-service', 'payment-service'],
      downstream: [],
    },
    endpoints: [
      { method: 'GET', path: '/health', desc: 'Liveness & service identity check' },
      { method: 'POST', path: '/orders', desc: 'Sequential transaction orchestrator' },
    ],
  },
  'inventory-service': {
    id: 'inventory-service',
    name: 'inventory-service',
    displayName: 'Inventory Service',
    port: 3004,
    role: 'Downstream Stock Reservation',
    description: 'Reserves inventory stock for items. Step 2 of order pipeline.',
    basePath: '/api/inventory',
    color: '#EC4899',
    canTarget: true,
    dependencies: {
      upstream: [],
      downstream: ['order-service'],
    },
    endpoints: [
      { method: 'GET', path: '/health', desc: 'Liveness & service identity check' },
      { method: 'POST', path: '/inventory/reserve', desc: 'Simulated stock reservation' },
      { method: 'GET', path: '/internal/faults', desc: 'Inspects in-memory active fault' },
      { method: 'POST', path: '/internal/faults', desc: 'Injects chaos fault' },
      { method: 'DELETE', path: '/internal/faults', desc: 'Clears injected chaos fault' },
    ],
  },
  'payment-service': {
    id: 'payment-service',
    name: 'payment-service',
    displayName: 'Payment Service',
    port: 3002,
    role: 'Downstream Payment Processor',
    description: 'Processes credit/debit charges. Step 3 of order pipeline.',
    basePath: '/api/payment',
    color: '#10B981',
    canTarget: true,
    dependencies: {
      upstream: [],
      downstream: ['order-service'],
    },
    endpoints: [
      { method: 'GET', path: '/health', desc: 'Liveness & service identity check' },
      { method: 'POST', path: '/payments/charge', desc: 'Simulated payment transaction' },
      { method: 'GET', path: '/internal/faults', desc: 'Inspects in-memory active fault' },
      { method: 'POST', path: '/internal/faults', desc: 'Injects chaos fault' },
      { method: 'DELETE', path: '/internal/faults', desc: 'Clears injected chaos fault' },
    ],
  },
};

export const TARGET_SERVICES = [
  {
    id: 'payment-service',
    name: 'Payment Service',
    port: 3002,
    role: 'Step 3: Downstream Payment',
  },
  {
    id: 'auth-service',
    name: 'Auth Service',
    port: 3003,
    role: 'Step 1: Upstream Gateway',
  },
  {
    id: 'inventory-service',
    name: 'Inventory Service',
    port: 3004,
    role: 'Step 2: Downstream Stock',
  },
];

export const FAULT_TYPES = [
  {
    id: 'latency',
    label: 'Artificial Latency',
    desc: 'Injects a configurable delay before processing incoming HTTP requests.',
    defaultParams: { latencyMs: 3000 },
  },
  {
    id: 'error',
    label: 'HTTP 500 Error',
    desc: 'Forces target service to immediately return an HTTP 500 Internal Server Error.',
    defaultParams: { statusCode: 500 },
  },
  {
    id: 'unavailable',
    label: 'Unavailable (Drop)',
    desc: 'Destroys incoming TCP connections immediately (simulates container crash / drop).',
    defaultParams: {},
  },
];

export const FAULT_IMPACTS = {
  'auth-service': {
    latency: 'Order Service will block on Step 1 (Token Verification). Overall transaction latency will spike.',
    error: 'Order Service will immediately fail on Step 1 (Auth). Inventory and Payment will never be invoked.',
    unavailable: 'Order Service cannot connect to Auth Service. Fails immediately on Step 1 with 502.',
  },
  'inventory-service': {
    latency: 'Auth succeeds immediately, but Order blocks on Step 2 (Stock Reservation).',
    error: 'Order Service passes Auth, but fails on Step 2 (Stock Reservation). Payment will never be invoked.',
    unavailable: 'Order Service cannot connect to Inventory. Fails on Step 2 with 502.',
  },
  'payment-service': {
    latency: 'Auth and Inventory succeed normally, but transaction hangs on Step 3 (Payment).',
    error: 'Order Service passes Auth and Inventory, but fails on Step 3 (Payment) returning 502 Bad Gateway.',
    unavailable: 'Order Service completes Auth and Inventory, but Payment connection drops with 502.',
  },
};

export const EXPERIMENT_STATUSES = {
  PENDING: { label: 'Pending', variant: 'neutral' },
  QUEUED: { label: 'Queued', variant: 'running' },
  RUNNING: { label: 'Running', variant: 'running' },
  COMPLETED: { label: 'Completed', variant: 'healthy' },
  FAILED: { label: 'Failed', variant: 'failed' },
};

export function getServiceColor(serviceId) {
  return SERVICES[serviceId]?.color || '#94A3B8';
}
