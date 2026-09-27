ChaosGuard — Memory

Current Phase

Phase 5 — Redis + BullMQ + Experiment Worker (implemented and verified)

Completed Work

Phase 0 — Project Foundation

Documentation created (prd.md, architecture.md, rules.md, phases.md, design.md)

Repository initialized

Phase 1 — Basic Microservices

Order Service (port 3001) and Payment Service (port 3002)

Node.js, Express, Axios

POST /orders, POST /payments, GET /health on both

Order → Payment HTTP communication

Dependency failure handling (502 on payment failure)

Phase 1.5 — Code Structure and Separation

Routes, controllers, services separated

order.routes.js, order.controller.js, payment.service.js

payment.routes.js, payment.controller.js

index.js files contain only server setup

Phase 2 — Dockerization

Dockerfile for each service

docker-compose.yml at project root

Services communicate via Docker Compose network (http://payment-service:3002)

PAYMENT_SERVICE_URL configured via environment variable

Phase 3 — Controlled Fault Injection

Fault injection middleware added to Payment Service

Three fault types supported via environment variables:

FAULT_LATENCY_MS: artificial delay in milliseconds

FAULT_ERROR: returns 500 error response

FAULT_UNAVAILABLE: destroys TCP connection (simulates crash)

All faults disabled by default

Health endpoint exempt from all faults

docker-compose.yml passes fault env vars with empty defaults

No new dependencies added

No changes to Order Service

Phase 4 — ChaosGuard Experiment API

New ChaosGuard API service (port 3000) — Express + Axios

Experiment CRUD:

POST /experiments

GET /experiments

GET /experiments/

Experiment lifecycle:

POST /experiments//start

POST /experiments//stop

Experiment statuses:

PENDING

RUNNING

COMPLETED

FAILED

Invalid lifecycle transitions rejected with 409

Input validation with 400 errors for bad target/fault/duration/parameters

In-memory experiment storage (Map)

Payment Service runtime fault control via internal API:

POST /internal/faults — activate a fault

DELETE /internal/faults — clear active fault

GET /internal/faults — check current fault state

Fault middleware refactored:

checks runtime state first

falls back to environment variables

/health and /internal paths exempt from fault injection

Duration-based experiment execution with automatic recovery via setTimeout

Best-effort fault clearing on experiment failure

Early stop support

ChaosGuard communicates with Payment Service using Axios over Docker network

Separation of concerns:

routes → controllers → services → models

No MongoDB, Redis, BullMQ, or external dependencies added in Phase 4

Phase 5 — Redis + BullMQ + Experiment Worker

Redis container added (redis:7-alpine) to Docker Compose

New experiment-worker service (services/experiment-worker/):

  Not an HTTP server — no ports exposed

  Consumes experiment jobs from BullMQ queue 'experiments'

  Activates fault, waits duration, clears fault

  Tracks faultActivated and faultCleared explicitly

  Stores faultCleared in job.progress before throwing (enables API to read it for failed jobs)

  Best-effort cleanup on failure (bestEffortClear)

  Graceful shutdown via SIGTERM/SIGINT

New experiment queue module (chaosguard-api/src/queues/experiment.queue.js):

  Producer side — adds jobs to BullMQ queue

  attempts: 1 (no auto-retry — safety requirement)

  removeOnComplete: false, removeOnFail: false (API reads job state for status sync)

Experiment model updated:

  New status: QUEUED (PENDING → QUEUED → RUNNING → COMPLETED/FAILED)

  New fields: jobId, queuedAt, faultCleared

  faultCleared: null (not applicable) | true (cleared) | false (NOT cleared — target may be broken)

Experiment service rewritten:

  start() enqueues to BullMQ, returns immediately (no in-process execution)

  stop() handles QUEUED (remove job, no fault activated) and RUNNING (clear fault directly)

  syncStatusFromQueue() — pull-based status sync from BullMQ on GET /experiments/:id

Experiment controller updated:

  getExperimentById() calls syncStatusFromQueue for QUEUED/RUNNING experiments

Docker Compose updated:

  redis service added

  experiment-worker service added (no ports)

  chaosguard-api: REDIS_URL env var added, depends_on redis

New dependencies:

  chaosguard-api: bullmq ^5, ioredis ^5

  experiment-worker: bullmq ^5, ioredis ^5, axios ^1.7

Existing API response shapes preserved — no breaking changes

Utility & Error-Handling Integration

The following common backend utilities were added to all three services:

ApiError

Location:

src/utils/ApiError.js

Purpose:

Standardized application error object

Stores statusCode, message, success, data, and errors

Preserves useful stack information

ApiResponse

Location:

src/utils/ApiResponse.js

Purpose:

Standardized success-response structure

Exists as a reusable utility

Not currently applied to existing Phase 1–4 success endpoints because doing so would change their established response contracts

asyncHandler

Location:

src/utils/asynchandler.js

Purpose:

Wraps asynchronous route/controller handlers

Forwards rejected promises to Express error middleware

Integrated into controllers where appropriate.

Centralized Error Middleware

Location:

src/middlewares/error.middleware.js

Purpose:

Centralizes unexpected/application error responses

Uses ApiError fields when available

Returns a consistent error shape

Includes stack information only in development mode

Utility Integration Notes

Existing successful API response shapes were intentionally preserved.

ApiResponse was not forced into existing endpoints because that would be an unnecessary contract change.

Synchronous controller functions that were wrapped by asyncHandler were converted to async where appropriate.

Syntax checks passed after integration.

Existing behavior was preserved.

Current Architecture

                         ┌─────────────────────┐
                         │    ChaosGuard API   │
                         │      :3000          │
                         │                     │
                         │ Experiment API      │
                         │ Experiment Service  │
                         │ BullMQ Queue        │
                         │   (producer)        │
                         └──────────┬──────────┘
                                    │
                                    │ Redis :6379
                                    │
                         ┌──────────▼──────────┐
                         │ Experiment Worker   │
                         │  (no HTTP port)     │
                         │                     │
                         │ BullMQ Worker       │
                         │   (consumer)        │
                         └──────────┬──────────┘
                                    │ Axios
                                    ▼
                         ┌─────────────────────┐
                         │   Payment Service   │
                         │       :3002         │
                         │                     │
                         │ Fault Injection     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Order Service    │
                         │       :3001         │
                         └─────────────────────┘

Current runtime characteristics:

Docker Compose provides service networking.

Experiment state is stored in memory (API process).

Payment runtime fault state is stored in memory (Payment Service process).

Experiment execution runs in the experiment-worker process via BullMQ.

Job data (state, results, failure reason) is stored in Redis.

API syncs experiment status from Redis on demand (GET /experiments/:id).

MongoDB, React, Socket.io, Auth, and Inventory are not yet implemented.

Important Architectural Decisions

1. ChaosGuard is a controlled chaos-engineering system

The project is focused on intentionally introducing controlled failures into a microservice environment and observing the resulting behavior.

The core loop is:

Baseline
   ↓
Inject Chaos
   ↓
Observe
   ↓
Measure
   ↓
Identify Weakness
   ↓
Improve Resilience
   ↓
Run Again
   ↓
Compare

2. AI is not required for the core system

AI-assisted analysis is an optional future layer.

The core system must remain useful for:

experiment execution

failure propagation

observability

metrics

experiment history

resilience testing

before/after comparison

RAG and vector search are not part of the current core roadmap.

3. Experiment execution is deliberately evolving

Phase 4 uses in-memory experiment state and in-process execution.

The next planned infrastructure change is:

ChaosGuard API
      ↓
Redis
      ↓
BullMQ
      ↓
Worker
      ↓
Controlled Fault Injection

This is intended to separate experiment execution from the API process.

4. Do not solve future problems prematurely

Known limitations should remain documented until their corresponding requirements are reached.

One known limitation is that concurrent experiments targeting the same service can interfere with the service's runtime fault state. A complex concurrency-management system should not be introduced before it is required.

5. Phase 5 safety and cleanup constraints

faultCleared is tracked explicitly. FAILED status does NOT imply the target service recovered — faultCleared: false means the target may still have an active fault. The operator must check GET /internal/faults and manually call DELETE /internal/faults if needed.

Worker startup does not automatically clear stale faults because reliable stale-job classification is not possible without additional infrastructure. Manual recovery is the documented recovery strategy.

BullMQ attempts is set to 1. Chaos experiments must not auto-retry.

Phase 5 Known Limitations

In-memory API state is lost on API restart — BullMQ job data survives in Redis but the API's experiment Map is gone. MongoDB persistence is Phase 11. Do not introduce MongoDB to solve this in Phase 5.

Concurrent experiments on the same target overwrite each other's fault state.

Worker crash after fault activation leaves fault active on target — requires manual intervention (GET /internal/faults + DELETE /internal/faults, or target restart).

No real-time push from worker to API — status is only updated on demand (GET /experiments/:id). Socket.io is Phase 9.

Single worker instance — BullMQ supports concurrency but this is not needed yet.

Testing / Verification Performed

Docker Compose services were built and run successfully.

Order Service and Payment Service health endpoints were checked.

Normal Order → Payment flow was verified.

Payment Service failure was simulated by stopping the Payment container.

Order Service correctly returned a payment-service error/timeout response.

Phase 4 experiment API lifecycle and validation behavior were verified.

Utility/error-handling integration passed syntax checks.

Existing successful response contracts were preserved.

Phase 5 verification:

All 5 containers start (redis, chaosguard-api, experiment-worker, order-service, payment-service).

Redis ping verified.

Worker connects to Redis and listens on 'experiments' queue.

API connects to Redis on startup.

Full experiment lifecycle verified: PENDING → QUEUED → RUNNING → COMPLETED.

Fault active on payment-service during experiment confirmed (GET /internal/faults).

Fault cleared after experiment confirmed (GET /internal/faults returns null).

faultCleared: true on successful completion.

Stop while QUEUED removes job, no fault activated, faultCleared: true.

Stop while RUNNING clears fault directly, faultCleared reflects outcome.

Failed experiment (target unreachable): status FAILED, faultCleared: true (nothing was activated).

Worker continues independently when API container is restarted.

Manual recovery path verified: GET /internal/faults detects stuck fault, DELETE /internal/faults clears it.

Current Status

Completed through Phase 5.

Current next phase:

Phase 6 — Auth + Inventory

Planned Roadmap

Phase 0  → Foundation                         ✓
Phase 1  → Basic Microservices                ✓
Phase 1.5→ Code Structure                     ✓
Phase 2  → Docker                             ✓
Phase 3  → Controlled Fault Injection        ✓
Phase 4  → Experiment API                     ✓
Phase 5  → Redis + BullMQ + Worker            ✓
Phase 6  → Auth + Inventory                   →
Phase 7  → React Dashboard
Phase 8  → React Flow Topology
Phase 9  → Socket.io Realtime
Phase 10 → Controlled Load Testing + Metrics
Phase 11 → MongoDB + Experiment History
Phase 12 → Resilience Testing + Comparison
Phase 13 → Safety / Reliability / Testing / Deployment / Polish
Optional → AI-Assisted Analysis

Development Philosophy

ChaosGuard is being built as a learning-focused engineering project.

For every major technology, the developer should understand:

What problem does it solve?

Why does ChaosGuard need it?

Why are we introducing it now?

What would happen without it?

How does it interact with the existing architecture?

The project should not become a collection of technologies added merely for a resume.

Each phase should:

introduce only what is required

preserve existing functionality

be tested before moving forward

update documentation when architecture changes

record meaningful decisions and known issues

Next Task

Phase 6 — Auth + Inventory (see phases.md for requirements).

Last Updated

2026-09-26
