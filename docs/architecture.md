CChaosGuard — System Architecture

1. Purpose

This document defines the technical architecture of ChaosGuard.

It describes:

The major components of the system

Responsibilities of each component

How components communicate

How experiments are created and executed

How faults are injected and removed

How failures propagate through service dependencies

How experiment data and metrics flow through the system

Why each major technology is used

The difference between the current implementation and the planned architecture

The architecture must evolve incrementally.

A technology should only be introduced when the current phase requires it.

The architecture should remain understandable at every stage rather than attempting to implement the complete final system at the beginning.

2. Architecture Principles

2.1 Incremental Development

ChaosGuard must be built phase by phase.

The project should not implement the complete final architecture at the beginning.

Each phase should introduce only the technologies and complexity required for that phase.

A future component should not be added merely because it appears in the final architecture.

2.2 Independent Services

The experimental environment is based on independently running microservices.

Each service should:

Have a clearly defined responsibility

Be independently runnable

Be independently testable

Communicate through defined interfaces

Be capable of failing independently

Remain understandable without requiring knowledge of the entire system

2.3 Controlled Failure

Chaos experiments must be intentionally triggered and controlled.

ChaosGuard should never randomly or autonomously introduce destructive failures into an uncontrolled environment.

The experiment system must know:

Which service is targeted

Which fault is being injected

What parameters are being used

When the experiment starts

How long the experiment should run

When the experiment ends

Whether the fault was successfully removed

Fault cleanup is part of the experiment lifecycle, not an optional afterthought.

2.4 Separation of Concerns

Different parts of the system should have different responsibilities.

For example:

Frontend
    ↓
User interaction and visualization

Backend
    ↓
API, validation and experiment orchestration

Queue
    ↓
Asynchronous experiment jobs

Worker
    ↓
Long-running experiment execution

Microservices
    ↓
Application behavior and failure propagation

Metrics / Observation
    ↓
Measurement of experiment impact

Database
    ↓
Persistent experiment history

Optional AI
    ↓
Analysis of observed experiment data

The analysis layer must not become responsible for executing the underlying experiment.

2.5 Controlled Experimental Environment

ChaosGuard is designed around a controlled environment.

The initial services are intentionally owned by the project so that their behavior can be understood and modified.

The platform should initially focus on experiments against this controlled environment rather than attempting to manage arbitrary external infrastructure.

2.6 Measure Before Concluding

ChaosGuard should not treat a service becoming red or unavailable as the complete result of an experiment.

The architecture should eventually support measurement of:

Request volume

Success rate

Error rate

Response latency

p50 latency

p95 latency

p99 latency

Timeout behavior

Throughput

Recovery behavior

Observed system data should remain the source of truth for experiment results.

3. High-Level Planned Architecture

The planned architecture is:

                              USER
                                |
                                v
                         React Frontend
                                |
                         HTTP / Socket.io
                                |
                                v
                       ChaosGuard Backend
                         /      |       \
                        /       |        \
                       v        v         v
                    Redis    MongoDB   Metrics/Events
                      |
                    BullMQ
                      |
                      v
               Experiment Worker
                      |
                      v
                Docker Environment
                      |
          +-----------+-----------+-----------+
          |           |           |           |
          v           v           v           v
        Auth        Order      Payment    Inventory
                      |
                  dependencies
                      |
                      v
                Failure Propagation

Not all components exist at the beginning.

The final architecture should be reached incrementally.

Optional future AI analysis may consume experiment results and observed metrics:

Experiment Results
        |
        v
Optional Analysis Layer
        |
        v
Explanation / Recommendations

AI is not required for the core experiment execution path.

4. Current Architecture

The current implementation (Phase 5) contains five containers:

                 HTTP
Client ──→ ChaosGuard API (:3000)
                 │
                 │ enqueues job
                 ▼
            Redis / BullMQ (:6379)
                 │
                 │ consumes job
                 ▼
         Experiment Worker (dedicated worker process)
                 │
                 │ HTTP (/internal/faults)
                 ▼
Order Service ───────────→ Payment Service (:3002)
   :3001

Current services:

chaosguard-api (:3000) — accepts HTTP requests, validates experiments, enqueues jobs to BullMQ, queries job status

experiment-worker — consumes jobs from BullMQ queue 'experiments', injects/clears faults on target services, tracks fault lifecycle

redis (:6379) — in-memory backing store for BullMQ queue

order-service (:3001) — sample microservice calling payment-service

payment-service (:3002) — target microservice exposing /internal/faults

The current architecture already includes:

Docker (all 5 containers running in docker-compose)

Controlled fault injection (latency, error, unavailable)

Experiment API (REST endpoints for creating, starting, stopping, querying experiments)

Redis + BullMQ (job queue for asynchronous experiment processing)

Dedicated Experiment Worker (execution decoupled from API process)

Runtime fault control and status synchronization (pull-based sync from BullMQ)

Centralized error handling and lifecycle validation

Explicit cleanup tracking (faultCleared boolean)

The current architecture does not yet require:

Auth Service (Phase 6)

Inventory Service (Phase 6)

React (Phase 7)

React Flow (Phase 8)

Socket.io (Phase 9)

MongoDB (Phase 11)

Load testing (Phase 10)

Advanced metrics (Phase 10)

These components should be introduced only in their respective phases.

5. Microservice Architecture

A microservice is an independently running application responsible for a specific capability.

The current system contains:

Order Service
      |
      v
Payment Service

The planned controlled environment expands toward:

                 Auth
                  |
                  v
                Order
               /     \
              v       v
          Payment   Inventory

The target environment should be introduced incrementally.

Planned service responsibilities

Auth Service

Responsible for authentication-related behavior within the controlled environment.

Its purpose in ChaosGuard is primarily to provide another independent dependency and failure boundary.

Order Service

Responsible for order-related behavior.

It currently acts as a caller of Payment Service.

Payment Service

Responsible for payment-related behavior.

It is currently one of the primary chaos targets.

Inventory Service

Responsible for inventory-related behavior.

It will provide another dependency from Order and create additional failure-propagation scenarios.

Each service should remain independently understandable and runnable.

6. Why Microservices?

ChaosGuard studies how failures propagate through distributed systems.

Microservices create independent failure boundaries.

For example:

Order
  |
  v
Payment

If Payment becomes unavailable:

Order
  |
  v
Payment X

The system can then be observed to determine:

Whether Order fails

Whether Order becomes slow

Whether requests time out

Whether errors increase

Whether retries occur after resilience mechanisms are introduced

Whether other dependent services are affected

This independent failure behavior is central to the purpose of ChaosGuard.

7. Node.js

Node.js is the backend runtime used for the microservices and ChaosGuard backend.

Its responsibility is to allow JavaScript code to run outside the browser.

Conceptually:

Node.js
   |
   +---- ChaosGuard API
   |
   +---- Order Service
   |
   +---- Payment Service
   |
   +---- Auth Service
   |
   +---- Inventory Service

Each service runs as its own Node.js process or container.

Node.js is used because it provides a lightweight environment for implementing HTTP-based services and fits the project's backend ecosystem.

8. Express

Express is the HTTP server/application framework used with Node.js.

It simplifies:

Creating HTTP servers

Defining routes

Handling requests

Sending responses

Adding middleware

Conceptually:

Application Code
       |
    Express
       |
    Node.js
       |
Operating System

For example:

POST /orders

is defined through Express routing.

Express is responsible for receiving and processing HTTP requests.

It is not responsible for queue processing or frontend rendering.

9. Server

A server is a running program that listens for incoming requests and produces responses.

For example:

Order Service
     |
     v
Express Server
     |
     v
Port 3001

The Payment Service has its own server:

Payment Service
     |
     v
Express Server
     |
     v
Port 3002

Therefore, the services are independently running programs.

10. Ports

Each service listens on a different port during local development.

Current configuration:

ChaosGuard API   → localhost:3000
Order Service   → localhost:3001
Payment Service → localhost:3002

Therefore:

http://localhost:3000

refers to the ChaosGuard API.

http://localhost:3001

refers to the Order Service.

http://localhost:3002

refers to the Payment Service.

Ports allow multiple network applications to run on the same computer without competing for the same listening endpoint.

Inside Docker, services should communicate using service names and container networking rather than assuming localhost.

11. HTTP Communication

Services communicate using HTTP.

Current request flow:

Client
   |
   | POST /orders
   v
Order Service
   |
   | POST /payments
   v
Payment Service
   |
   | JSON response
   v
Order Service
   |
   | JSON response
   v
Client

HTTP is used because it provides a simple and widely supported mechanism for service-to-service communication.

12. API Endpoints

The current services expose:

ChaosGuard API

POST /experiments
GET  /experiments
GET  /experiments/:id
POST /experiments/:id/start
POST /experiments/:id/stop

Order Service

POST /orders
GET  /health

Payment Service

POST /payments
GET  /health

Payment Service also exposes internal fault-control endpoints used by ChaosGuard:

POST   /internal/faults
DELETE /internal/faults
GET    /internal/faults

The API contract should remain explicit and stable as the project evolves.

13. Request and Response Model

Services exchange structured data using JSON.

Example Order request:

{
  "item": "Laptop",
  "amount": 50000
}

Order creates an order ID and sends a request to Payment:

{
  "orderId": "ord_123",
  "amount": 50000
}

Payment returns:

{
  "paymentId": "pay_456",
  "orderId": "ord_123",
  "amount": 50000,
  "status": "success"
}

Order then returns the relevant information to the original client.

As new services are introduced, their API contracts should remain explicit.

14. Axios

Axios is used by Order Service as an HTTP client.

Express primarily helps a service receive and handle requests.

Axios allows Order Service to send a request to Payment Service.

Conceptually:

Express
   ↓
Receive requests

Axios
   ↓
Send requests

Current flow:

Order Service
      |
      | Axios
      v
Payment Service

Axios is therefore part of the service-to-service communication layer rather than the experiment queue.

15. Service-to-Service Request Flow

A complete order request currently follows this flow:

Client sends POST /orders.

Order Service receives the request.

Express parses the JSON body.

Order Service validates the request.

Order Service creates an order ID.

Order Service sends an HTTP POST request to Payment Service using Axios.

Payment Service receives POST /payments.

Payment Service validates the request.

Payment Service creates a payment ID.

Payment Service returns a JSON response.

Order Service receives the response.

Order Service returns the final response to the client.

This simple flow becomes the baseline behavior against which chaos experiments can be observed.

16. Failure Flow

If Payment Service is unavailable:

Client
   |
   v
Order Service
   |
   | HTTP request
   v
Payment Service
      X
   unavailable

The request from Order Service fails.

Order Service handles the failure using its error-handling path and returns an appropriate error response to the client.

This behavior provides the foundation for future resilience experiments.

For example, after resilience mechanisms are introduced, the same failure can be tested again to determine whether Order behaves differently.

17. Docker Architecture

Docker provides the controlled environment in which the microservices can be run consistently.

Planned structure:

Docker Environment
│
├── ChaosGuard API Container
├── Order Service Container
├── Payment Service Container
├── Auth Service Container
├── Inventory Service Container
├── Redis Container
└── MongoDB Container

Not every container exists in every phase.

Docker's purpose is to create an isolated and reproducible environment where services can be:

Started consistently

Stopped independently

Connected through a known network

Experimented on safely

Reproduced across machines

Docker should not be introduced merely for the sake of using Docker.

18. Container Networking

Once services are containerized, they should communicate through the Docker network rather than relying on local development assumptions.

For example:

Order Container
      |
      | HTTP
      v
Payment Container

The Order Service should use a configured service URL such as:

http://payment-service:3002

rather than hardcoding a machine-specific address.

Service discovery and environment-specific configuration should use environment variables.

19. Fault Injection Architecture

ChaosGuard introduces controlled faults into supported services.

Initial fault types:

Latency

Error

Service unavailable

Example latency experiment:

Normal:

Order
  |
  v
Payment
  |
  v
100 ms response

Chaos:

Order
  |
  v
Payment
  |
  v
3000 ms response

The fault injection mechanism should be explicit and controllable.

20. Runtime Fault State

The current fault-injection system supports runtime fault configuration.

A target service can receive an internal request from ChaosGuard to activate a fault.

Conceptually:

ChaosGuard API / Worker
          |
          | POST /internal/faults
          v
Target Service
          |
          v
Runtime Fault State

The target service's fault middleware checks the active runtime fault and applies the configured behavior.

The runtime fault can later be removed:

ChaosGuard
    |
    | DELETE /internal/faults
    v
Target Service
    |
    v
Fault cleared

The fault system should remain isolated from public application endpoints.

21. Experiment API

The ChaosGuard backend exposes the experiment API.

Conceptually:

POST /experiments

with information such as:

{
  "service": "payment",
  "fault": "latency",
  "value": 3000,
  "duration": 30
}

The API should validate the experiment configuration before execution.

The experiment API should not contain all long-running experiment execution logic.

22. Experiment Lifecycle

An experiment represents a controlled chaos operation.

The intended lifecycle is:

PENDING
   |
   v
QUEUED
   |
   v
RUNNING
   |
   +--------+
   |        |
   v        v
COMPLETED  FAILED
   |
   v
Cleanup

An experiment may also be explicitly stopped or aborted depending on the final lifecycle design.

The lifecycle should make the current state of an experiment unambiguous.

23. Redis

Redis will provide infrastructure for asynchronous experiment processing.

For ChaosGuard, Redis is primarily intended to support the experiment job system.

It may later support other justified infrastructure concerns such as:

Temporary state

Rate limiting

Event-related infrastructure

Redis should not be introduced until the project reaches the phase that requires asynchronous experiment processing.

Redis is infrastructure, not the experiment business logic itself.

24. BullMQ

BullMQ will be used as the job/queue system built on Redis.

The planned flow is:

ChaosGuard Backend
        |
        v
      BullMQ
        |
        v
       Redis
        |
        v
      Worker
        |
        v
Execute Experiment

This separates receiving an experiment request from executing the potentially long-running experiment.

BullMQ can later support:

Job creation

Job processing

Delayed jobs

Retries

Job status

Worker concurrency

Queue behavior should be introduced only when the experiment execution becomes asynchronous.

25. Experiment Worker

The worker is responsible for executing experiment jobs.

The intended responsibility is:

Receive experiment job
        |
        v
Validate experiment
        |
        v
Target specified service
        |
        v
Apply controlled fault
        |
        v
Observe experiment
        |
        v
Collect experiment data/events
        |
        v
Remove fault
        |
        v
Record final state

The worker should not be responsible for:

Frontend rendering

Direct UI interaction

Generating the experiment's ground truth

Autonomous destructive decisions

The worker is the execution component of the experiment system.

26. Worker and Target-Service Communication

The worker should communicate with target services through an explicit internal interface.

Conceptually:

Experiment Worker
       |
       | activate fault
       v
Target Service
       |
       | runtime fault state
       v
Fault Middleware

After the experiment duration:

Experiment Worker
       |
       | clear fault
       v
Target Service

The worker should be able to handle both successful and failed execution paths.

A future implementation must also consider what happens if the worker stops unexpectedly after activating a fault.

Fault cleanup and recovery guarantees should be treated as an explicit safety concern rather than assuming queue recovery alone solves cleanup.

27. React Frontend

The final user interface will be built using React.

The frontend will allow users to:

View services

View topology

Configure experiments

Create experiments

Start experiments

Monitor experiment progress

View experiment metrics

View affected services

View experiment results

Review experiment history

Compare experiments

Optional future AI analysis can be displayed as part of an experiment report.

The frontend communicates with the backend through HTTP APIs and real-time events.

The frontend should hide infrastructure details from the user.

The user should see:

Create
   ↓
Start
   ↓
Watch
   ↓
Analyze
   ↓
Compare

rather than needing to understand Redis, BullMQ, or worker internals.

28. React Flow

React Flow will be used to visualize the microservice topology.

Example:

         Auth 🟢
            |
            v
         Order 🟡
          /   \
         v     v
 Payment 🔴  Inventory 🟢

The graph should represent service dependencies and update based on observed experiment states.

React Flow is a visualization layer.

It should not contain the actual experiment execution logic.

The backend remains responsible for experiment state and the frontend renders that state.

29. Socket.io

HTTP follows a request/response model.

For live experiment updates, ChaosGuard will use Socket.io.

Planned flow:

Experiment Worker
       |
       | event
       v
ChaosGuard Backend
       |
       | Socket.io
       v
React Dashboard

Example events:

experiment_queued
experiment_started
fault_injected
service_degraded
service_failed
dependency_affected
fault_removed
service_recovered
experiment_completed
experiment_failed

The frontend can use these events to update the experiment state and topology without repeatedly polling the backend.

30. Metrics and Observability Architecture

Metrics are a core part of the eventual chaos-engineering workflow.

The architecture should distinguish between:

System State
     +
Request Behavior
     +
Experiment Events
     =
Experiment Observations

Relevant measurements may include:

Request count

Success count

Error count

Error rate

Response latency

p50 latency

p95 latency

p99 latency

Timeout count

Throughput

Recovery time

The exact implementation should be introduced incrementally.

The first versions may use simple application-level measurements.

More advanced observability should only be introduced when it solves a demonstrated requirement.

31. Baseline and Experiment Measurements

A meaningful experiment should eventually distinguish between different periods:

Before Experiment
       |
       v
Baseline
       |
       v
During Experiment
       |
       v
Chaos
       |
       v
After Fault Removal
       |
       v
Recovery

Measurements from these periods can be compared.

For example:

                 Baseline   Chaos   Recovery

p95 latency       100ms    3000ms    120ms
error rate          0%       30%       2%

The purpose is to measure system behavior rather than simply observe a service status change.

32. Controlled Load Testing

ChaosGuard should eventually support controlled traffic generation.

The purpose is to create enough predictable traffic to measure system behavior during an experiment.

Conceptually:

Load Generator
      |
      v
Order Service
      |
      v
Payment Service

During a chaos experiment:

Load
 |
 v
Order
 |
 v
Payment 🔴
 |
 v
Measured Impact

The load generator must remain limited to the controlled environment.

The load-testing component should not be introduced until the service environment and experiment execution are stable.

33. Experiment Results

An experiment result should eventually contain:

Experiment configuration

Target service

Fault type

Fault parameters

Start time

End time

Duration

Status

Affected services

Experiment events

Baseline measurements

During-chaos measurements

Recovery measurements

Blast radius

Recovery behavior

The experiment result should describe what was observed.

The system should not infer conclusions that are unsupported by the observed data.

34. MongoDB

MongoDB will eventually be used for persistent experiment storage.

Potential stored information includes:

Experiments

Experiment results

Experiment events

Service information

Experiment configurations

Metric summaries

MongoDB is introduced only after the system has meaningful experiment data that needs to survive service restarts.

The database should provide persistence.

It should not become responsible for experiment execution logic.

35. Experiment History

Once MongoDB persistence is introduced, the platform can maintain experiment history.

Conceptually:

Experiment
    |
    v
MongoDB
    |
    v
Experiment History

A history entry should allow users to identify:

Target service

Fault

Duration

Status

Date/time

Key measurements

Selecting an experiment should open its detailed result.

36. Experiment Comparison

Experiment comparison is important for the resilience-testing loop.

The intended flow is:

Experiment A
    |
    | resilience improvement
    v
Experiment B
    |
    v
Compare

For example:

Before improvement
        vs
After improvement

Comparison may include:

p95 latency

p99 latency

Error rate

Timeout count

Throughput

Recovery time

Number of affected services

The comparison system should use actual recorded experiment data.

37. Resilience Testing Architecture

ChaosGuard should eventually support a complete resilience-testing loop:

                 Baseline
                    |
                    v
              Chaos Experiment
                    |
                    v
                 Measure
                    |
                    v
            Identify Weakness
                    |
                    v
          Apply Resilience Fix
                    |
                    v
              Run Again
                    |
                    v
                 Measure
                    |
                    v
              Compare

Potential resilience mechanisms to evaluate include:

Timeouts

Retries

Circuit breakers

Fallbacks

Dependency isolation

Rate limiting

ChaosGuard does not need to implement every resilience mechanism itself.

The controlled services can be modified by the developer, after which ChaosGuard reruns the experiment and measures the resulting behavior.

This creates a practical demonstration of whether a resilience improvement changed system behavior under failure.

38. Failure Propagation

Failure propagation is one of the central architectural concepts of ChaosGuard.

Example:

Payment
   |
   v
Order
   |
   v
Inventory

If Payment becomes slow:

Payment 🔴
    |
    v
Order 🟡
    |
    v
Inventory 🟡

The architecture should eventually capture:

Fault origin

Direct dependency impact

Indirect dependency impact

Service state changes

Relevant metrics

Recovery

The topology graph should represent these relationships visually.

39. Blast Radius

Blast radius describes the extent of the observed impact of an experiment.

For example:

Fault:
Payment latency

Observed impact:
Payment
Order

If Inventory is unaffected:

Payment 🔴
   |
   v
Order 🟡
   |
   v
Inventory 🟢

The experiment result can therefore distinguish between:

Target service

Directly affected services

Indirectly affected services

Unaffected services

Blast-radius calculation should be based on observed system behavior and known service dependencies.

40. Experiment Safety

Safety is an architectural requirement.

The system should prevent experiments from becoming uncontrolled.

Important safety mechanisms include:

Explicit experiment creation

Explicit experiment start

Target validation

Supported fault validation

Duration limits

Fault cleanup

Controlled target environment

Experiment termination

Clear experiment lifecycle states

The AI layer must not independently execute experiments.

A future safety layer may additionally prevent:

Unsupported targets

Invalid fault parameters

Excessive durations

Concurrent experiments that conflict with one another

These controls should be added when the architecture requires them.

41. Concurrency Considerations

The current runtime fault architecture has a known limitation.

If multiple experiments target the same service simultaneously, one experiment may overwrite the runtime fault state created by another.

For example:

Experiment A
Payment → 3000ms latency

Experiment B
Payment → error

If both run at the same time, a simple single-fault runtime state cannot safely represent both experiments.

This is a known architectural limitation.

It should not be solved prematurely.

When concurrent experiments become a real requirement, the architecture should explicitly define:

Experiment isolation

Target locking

Fault composition

Conflict detection

Cleanup ownership

Until then, the system should keep the fault model simple and understandable.

42. Worker Failure and Cleanup

A separate worker process introduces another important failure scenario.

For example:

Worker
  |
  | activate fault
  v
Payment 🔴
  |
  X
Worker crashes

If the worker crashes after activating a fault, queue recovery alone does not automatically guarantee that the target service is restored.

Therefore, the final architecture should consider fault cleanup guarantees.

Potential mechanisms may include:

Fault expiration inside the target service

Experiment leases

Cleanup jobs

Worker recovery handling

Safety timeouts

The exact mechanism should be selected when the worker architecture is implemented.

The important architectural requirement is that fault cleanup must remain reliable even when the experiment executor fails.

43. Optional AI Analysis

AI is an optional future analysis layer.

If implemented, it should consume actual experiment information such as:

Experiment configuration

Observed metrics

Failure events

Affected services

Dependency information

Experiment history

It may produce:

Explanation

Risk observations

Possible contributing factors

Resilience suggestions

The AI layer must not replace observed experiment data.

For example:

Observed:
Payment latency increased from baseline
and Order timeout rate increased.

AI:
Explains the likely relationship and suggests
possible resilience mechanisms to investigate.

The AI layer should not be treated as the source of truth for whether a service actually failed.

44. AI Boundary

The intended separation is:

User
 |
 | explicitly configures experiment
 v
Experiment API
 |
 v
Experiment System
 |
 v
Controlled Fault Injection
 |
 v
Observed Results
 |
 v
Optional AI Analysis
 |
 v
Explanation / Recommendations

The AI may recommend a resilience mechanism or an additional experiment.

Execution remains explicitly controlled by the experiment system and user.

45. Complete Final Experiment Flow

A complete experiment should eventually follow this flow:

User
 |
 v
React Dashboard
 |
 | Configure experiment
 v
ChaosGuard Backend
 |
 | Create experiment
 v
BullMQ / Redis
 |
 v
Experiment Worker
 |
 | Activate controlled fault
 v
Dockerized Microservices
 |
 | Failure propagation
 v
Events + Metrics
 |
 +----------------------+
 |                      |
 v                      v
Socket.io           Persistence
 |                      |
 v                      v
React Dashboard      MongoDB
 |
 v
Experiment Result
 |
 v
Optional AI Analysis
 |
 v
Explanation / Recommendations
 |
 v
Experiment Report

For resilience testing:

Experiment Report
       |
       v
Developer identifies weakness
       |
       v
Developer applies resilience improvement
       |
       v
Same or comparable experiment
       |
       v
New Experiment Result
       |
       v
Comparison

46. Architecture Boundaries

The following boundaries should be maintained.

Frontend

Responsible for:

UI

User interaction

Topology visualization

Experiment configuration

Live experiment display

Results display

Comparison display

Not responsible for:

Executing chaos directly

Database access

Direct target-service control

Worker execution

ChaosGuard Backend

Responsible for:

API

Experiment configuration

Validation

Experiment lifecycle

Queue interaction

Orchestration

Communication between system components

Publishing relevant events

Not responsible for:

Rendering UI

Performing all long-running experiment work directly

Being the source of observed service metrics

Queue

Responsible for:

Holding experiment jobs

Decoupling API requests from worker execution

Supporting asynchronous execution

Not responsible for:

Performing experiment logic itself

Rendering UI

Worker

Responsible for:

Executing experiment jobs

Targeting services

Activating faults

Waiting for experiment duration

Collecting relevant observations

Removing faults

Updating experiment state

Not responsible for:

UI rendering

Frontend state

Optional AI-generated explanations

Microservices

Responsible for:

Application behavior

Service-to-service communication

Producing realistic failure behavior

Exposing controlled internal fault interfaces

Not responsible for:

Managing the experiment dashboard

Persisting global experiment history

Deciding when an experiment should start

Metrics / Observation

Responsible for:

Measuring system behavior

Capturing experiment-relevant measurements

Supporting baseline, chaos, and recovery comparisons

Not responsible for:

Injecting faults

Making autonomous experiment decisions

Database

Responsible for:

Persistent experiment data

Experiment history

Results

Relevant events and metric summaries

Not responsible for:

Business logic

Direct fault injection

Optional AI

Responsible for:

Analysis

Explanation

Recommendations based on observed data

Not responsible for:

Executing experiments

Directly controlling infrastructure

Replacing observed system behavior

Autonomous destructive actions

47. Technology Introduction Order

Technologies should be introduced according to actual project requirements:

Node.js
   ↓
Express
   ↓
HTTP / Axios
   ↓
Microservices
   ↓
Docker
   ↓
Fault Injection
   ↓
Experiment API
   ↓
Redis
   ↓
BullMQ
   ↓
Experiment Worker
   ↓
Auth + Inventory Services
   ↓
React
   ↓
React Flow
   ↓
Socket.io
   ↓
Metrics / Controlled Load Testing
   ↓
MongoDB
   ↓
Experiment History
   ↓
Experiment Comparison
   ↓
Resilience Testing Loop
   ↓
Optional AI Analysis

The important principle is:

A technology should not be added simply because it appears in the final architecture.

It should be added when the corresponding phase requires it.

RAG and vector search are not part of the core technology introduction order.

If AI is implemented later, it should be based on actual experiment data rather than being added as a separate generic knowledge-retrieval system.

48. Current vs Planned Architecture

Current

Client
  |
  v
ChaosGuard API
  |
  | experiment management
  |
  +----------------------+
  |                      |
  v                      v
Order Service -------> Payment Service
      HTTP / Axios

Current technologies include:

Node.js

Express

HTTP

Axios

Docker

Runtime fault injection

Experiment API

In-memory experiment state

Centralized error handling

Planned Phase 5

Client
  |
  v
ChaosGuard API
  |
  v
BullMQ / Redis
  |
  v
Experiment Worker
  |
  v
Target Microservice

The major architectural change is that long-running experiment execution moves out of the API request path.

Planned Expanded Environment

                 Auth
                  |
                  v
                Order
               /     \
              v       v
          Payment   Inventory

Planned Final System

React
  |
  +---- HTTP
  |
  +---- Socket.io
  |
  v
ChaosGuard Backend
  |
  +---- Redis / BullMQ
  |
  +---- MongoDB
  |
  +---- Metrics / Events
  |
  v
Experiment Worker
  |
  v
Dockerized Microservices
  |
  +---- Auth
  +---- Order
  +---- Payment
  +---- Inventory

Optional future analysis:

Experiment Results
        |
        v
Optional AI Analysis
        |
        v
Explanation / Recommendations

49. Phase 5 Architectural Focus

Phase 5 introduces asynchronous experiment execution.

The primary architectural change is:

Before:

Client
  ↓
ChaosGuard API
  ↓
Experiment execution


After:

Client
  ↓
ChaosGuard API
  ↓
Redis / BullMQ
  ↓
Worker
  ↓
Experiment execution

The purpose is to prevent long-running experiments from occupying the API request path.

Phase 5 should focus on:

Redis

BullMQ

Worker process

Job creation

Job processing

Experiment state transitions

Target-service communication

Fault cleanup

Worker failure handling

The phase should not prematurely introduce:

React

React Flow

Socket.io

MongoDB

Load testing

AI

Additional microservices

Those belong to later phases.

50. Architectural Risks to Track

The architecture should explicitly track known risks rather than hiding them.

50.1 Shared Runtime Fault State

Multiple experiments targeting one service may conflict.

Current approach:

One target service
       |
       v
One active runtime fault

This is acceptable while concurrency is not a requirement.

50.2 Worker Crash During Experiment

A worker can potentially fail after activating a fault.

The target service therefore needs a reliable eventual cleanup mechanism.

This becomes more important once Phase 5 introduces a separate worker process.

50.3 Metrics Accuracy

Simple application-level measurements may not initially represent complete distributed-system behavior.

Metrics should therefore be introduced incrementally and clearly labeled according to what they actually measure.

50.4 Increasing Service Complexity

Adding Auth and Inventory increases the number of possible dependency paths.

Services should therefore be introduced only when the current experiment model is stable enough to support them.

51. Architecture Decision Principle

Every architectural decision should answer three questions:

What problem does this component solve?

Why is this technology appropriate for that problem?

Why are we introducing it at this stage?

If these questions cannot be answered clearly, the component should not be introduced yet.

This principle is especially important for technologies such as:

Redis

BullMQ

MongoDB

Socket.io

Load testing tools

OpenTelemetry

AI systems

52. Final Architectural Goal

ChaosGuard should demonstrate a coherent distributed system rather than a collection of unrelated technologies.

The final architecture should show a clear chain:

Microservices
      ↓
Service Dependencies
      ↓
Controlled Faults
      ↓
Experiment Execution
      ↓
Failure Propagation
      ↓
Observation
      ↓
Measurement
      ↓
Experiment Results
      ↓
Resilience Improvement
      ↓
Rerun
      ↓
Comparison
      ↓
Optional AI Analysis

Every technology in the final stack must have a clear responsibility in this chain.

The central architectural goal is:

Build a controlled distributed system, intentionally introduce failures, measure how the system behaves, and use repeatable experiments to evaluate resilience improvements.