# ChaosGuard — Memory

## Current Phase

Phase 4 — ChaosGuard Experiment API (implemented and verified)

---

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
- Experiment CRUD:
  - POST /experiments
  - GET /experiments
  - GET /experiments/:id
- Experiment lifecycle:
  - POST /experiments/:id/start
  - POST /experiments/:id/stop
- Experiment statuses:
  - PENDING
  - RUNNING
  - COMPLETED
  - FAILED
- Invalid lifecycle transitions rejected with 409
- Input validation with 400 errors for bad target/fault/duration/parameters
- In-memory experiment storage (Map)
- Payment Service runtime fault control via internal API:
  - POST /internal/faults — activate a fault
  - DELETE /internal/faults — clear active fault
  - GET /internal/faults — check current fault state
- Fault middleware refactored:
  - checks runtime state first
  - falls back to environment variables
- /health and /internal paths exempt from fault injection
- Duration-based experiment execution with automatic recovery via setTimeout
- Best-effort fault clearing on experiment failure
- Early stop support
- ChaosGuard communicates with Payment Service using Axios over Docker network
- Separation of concerns:
  - routes → controllers → services → models
- No MongoDB, Redis, BullMQ, or external dependencies added

---

## Utility & Error-Handling Integration

The following common backend utilities were added to all three services:

### ApiError

Location:

```text
src/utils/ApiError.js
