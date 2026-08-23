# ChaosGuard — Memory

## Current Phase

Phase 4 — ChaosGuard Experiment API (implemented and verified)

## Completed Work

### Phase 0 — Project Foundation
- Documentation created (prd.md, architecture.md, rules.md, phases.md, design.md)
- Repository initialized

### Phase 1 — Basic Microservices
- Order Service (port 3001) and Payment Service (port 3002)
- Node.js, Express, Axios
- POST /orders, POST /payments, GET /health on both
- Order → Payment HTTP communication
- Dependency failure handling (502 on payment failure)

### Phase 1.5 — Code Structure and Separation
- Routes, controllers, services separated
- order.routes.js, order.controller.js, payment.service.js
- payment.routes.js, payment.controller.js
- index.js files contain only server setup

### Phase 2 — Dockerization
- Dockerfile for each service
- docker-compose.yml at project root
- Services communicate via Docker Compose network (http://payment-service:3002)
- PAYMENT_SERVICE_URL configured via environment variable

### Phase 3 — Controlled Fault Injection
- Fault injection middleware added to Payment Service
- Three fault types supported via environment variables:
  - FAULT_LATENCY_MS: artificial delay in milliseconds
  - FAULT_ERROR: returns 500 error response
  - FAULT_UNAVAILABLE: destroys TCP connection (simulates crash)
- All faults disabled by default
- Health endpoint exempt from all faults
- docker-compose.yml passes fault env vars with empty defaults
- No new dependencies added
- No changes to Order Service

### Phase 4 — ChaosGuard Experiment API
- New ChaosGuard API service (port 3000) — Express + Axios
- Experiment CRUD: POST /experiments, GET /experiments, GET /experiments/:id
- Experiment lifecycle: POST /experiments/:id/start, POST /experiments/:id/stop
- Experiment statuses: PENDING → RUNNING → COMPLETED / FAILED
- Invalid lifecycle transitions rejected with 409
- Input validation with 400 errors for bad target/fault/duration/parameters
- In-memory experiment storage (Map)
- Payment Service runtime fault control via internal API:
  - POST /internal/faults — activate a fault
  - DELETE /internal/faults — clear active fault
  - GET /internal/faults — check current fault state
- Fault middleware refactored: checks runtime state first, falls back to env vars
- /health and /internal paths exempt from fault injection
- Duration-based experiment execution with automatic recovery via setTimeout
- Best-effort fault clearing on experiment failure
- Early stop support (POST /experiments/:id/stop)
- ChaosGuard communicates with Payment Service using Axios over Docker network
- Separation of concerns: routes → controllers → services → models
- No MongoDB, Redis, BullMQ, or external dependencies added

## Current Architecture

```
Docker Compose
│
├── chaosguard-api (port 3000)           ← Phase 4
│   └── src/
│       ├── index.js
│       ├── routes/experiment.routes.js
│       ├── controllers/experiment.controller.js
│       ├── services/experiment.service.js
│       ├── services/target.service.js
│       └── models/experiment.model.js
│
├── order-service (port 3001)
│   └── src/
│       ├── index.js
│       ├── routes/order.routes.js
│       ├── controllers/order.controller.js
│       └── services/payment.service.js
│
└── payment-service (port 3002)
    └── src/
        ├── index.js                      (modified Phase 4)
        ├── routes/payment.routes.js
        ├── routes/internal.routes.js      ← Phase 4
        ├── controllers/payment.controller.js
        ├── controllers/internal.controller.js  ← Phase 4
        ├── middleware/fault.middleware.js  (modified Phase 4)
        └── state/fault.state.js           ← Phase 4
```

## Request Flows

### Create Experiment
```
Client → POST /experiments → experiment.controller → experiment.service.create → experiment.model → 201 PENDING
```

### Start Experiment
```
Client → POST /experiments/:id/start
  → experiment.controller
  → experiment.service.start
  → target.service.activateFault (Axios POST /internal/faults)
  → Payment Service internal.controller.activateFault
  → fault.state.setActiveFault
  → setTimeout(duration)
  → [after duration] target.service.clearFault (Axios DELETE /internal/faults)
  → experiment status → COMPLETED
```

### Runtime Fault Flow
```
Any request to Payment Service
  → fault.middleware
  → checks fault.state.getActiveFault() (runtime, Phase 4)
  → falls back to env vars (Phase 3)
  → applies fault or passes through
```

## Files Created (Phase 4)

### ChaosGuard API (new service)
- services/chaosguard-api/package.json
- services/chaosguard-api/package-lock.json
- services/chaosguard-api/Dockerfile
- services/chaosguard-api/.dockerignore
- services/chaosguard-api/src/index.js
- services/chaosguard-api/src/routes/experiment.routes.js
- services/chaosguard-api/src/controllers/experiment.controller.js
- services/chaosguard-api/src/services/experiment.service.js
- services/chaosguard-api/src/services/target.service.js
- services/chaosguard-api/src/models/experiment.model.js

### Payment Service (new files)
- services/payment-service/src/state/fault.state.js
- services/payment-service/src/controllers/internal.controller.js
- services/payment-service/src/routes/internal.routes.js

## Files Modified (Phase 4)

- services/payment-service/src/middleware/fault.middleware.js (runtime state + env fallback)
- services/payment-service/src/index.js (mount internal routes)
- docker-compose.yml (added chaosguard-api service)

## Tests Performed (Phase 4)

47 tests, 47 passed, 0 failed.

| # | Test | Result |
|---|------|--------|
| 1 | ChaosGuard API /health | ✅ |
| 2 | Order Service /health | ✅ |
| 3 | Payment Service /health | ✅ |
| 4 | Normal POST /payments | ✅ |
| 5 | Normal POST /orders | ✅ |
| 6 | Validation: empty body → 400 | ✅ |
| 7 | Validation: bad target → 400 | ✅ |
| 8 | Validation: bad fault → 400 | ✅ |
| 9 | Validation: latency without params → 400 | ✅ |
| 10 | Validation: negative duration → 400 | ✅ |
| 11 | Create latency experiment → 201 PENDING | ✅ |
| 12 | GET experiment by ID → 200 | ✅ |
| 13 | GET nonexistent → 404 | ✅ |
| 14 | GET all experiments → 200 | ✅ |
| 15 | Start latency experiment → RUNNING | ✅ |
| 16 | Payments delayed ~2000ms during latency | ✅ (2015ms) |
| 17 | Orders delayed ~2000ms during latency | ✅ (2039ms) |
| 18 | /health NOT delayed during latency | ✅ (10ms) |
| 19 | Start already RUNNING → 409 | ✅ |
| 20 | Experiment auto-completes after duration | ✅ |
| 21 | Payments recovered after completion | ✅ (18ms) |
| 22 | Start COMPLETED → 409 | ✅ |
| 23 | Error experiment: payments → 500 | ✅ |
| 24 | Error experiment: orders → 502 | ✅ |
| 25 | /health OK during error fault | ✅ |
| 26 | Error experiment auto-completes | ✅ |
| 27 | Payments recovered after error experiment | ✅ (25ms) |
| 28 | Unavailable: payments → connection error | ✅ |
| 29 | Unavailable: orders → 502 | ✅ |
| 30 | /health OK during unavailable fault | ✅ |
| 31 | Unavailable experiment auto-completes | ✅ |
| 32 | Payments recovered after unavailable | ✅ (22ms) |
| 33 | Stop: long experiment started | ✅ |
| 34 | Stop: latency active during experiment | ✅ (2010ms) |
| 35 | Stop: experiment stopped early → COMPLETED | ✅ |
| 36 | Stop: payments recovered after stop | ✅ (8ms) |
| 37 | Stop: stop already COMPLETED → 409 | ✅ |

## Known Issues

- Experiment storage is in-memory only. Restarting the container loses all experiment data. Persistence will be added in a later phase.
- Only one fault can be active at a time per target service.
- Only `payment-service` is a supported target in Phase 4.

## Next Task

Phase 5

## Last Updated

2026-08-23
