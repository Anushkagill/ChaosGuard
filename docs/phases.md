ChaosGuard — Development Phases

1. Purpose

This document defines the incremental development roadmap for ChaosGuard.

ChaosGuard must be built one phase at a time.

Each phase introduces only the technologies and complexity required at that stage.

A phase must satisfy its acceptance criteria before the project moves to the next phase.

Future-phase features must not be implemented early unless explicitly approved.

The roadmap is designed around the core ChaosGuard loop:

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
Compare Results

The project should prioritize depth of understanding, repeatable experiments, measurable results, and architectural coherence over the number of technologies used.

Phase 0 — Project Foundation

Goal

Establish the project structure, documentation, development rules, and Git repository.

Deliverables

Project repository

README.md

.gitignore

docs/prd.md

docs/architecture.md

docs/rules.md

docs/phases.md

docs/design.md

Technologies

Git

Node.js development environment

Do Not Build

Docker

Redis

MongoDB

React

Socket.io

AI

Load testing

Fault injection

Acceptance Criteria

Documentation exists and describes the intended product.

Development rules are defined.

Development phases are defined.

Repository has a clean initial structure.

The project direction is consistent across the documentation.

Phase 1 — Basic Microservices

Goal

Build and understand the smallest useful distributed system consisting of two independently running services.

Services

Order Service
      |
      | HTTP
      v
Payment Service

Technologies

Node.js

Express

HTTP

JSON

Axios

npm

Order Service

Responsibilities:

Receive order requests.

Validate basic order input.

Generate a temporary order ID.

Request payment processing from Payment Service.

Return the payment result to the client.

Handle Payment Service failures.

Initial endpoints:

POST /orders
GET  /health

Payment Service

Responsibilities:

Receive payment requests.

Validate basic payment input.

Generate a temporary payment ID.

Return a simulated successful payment response.

Initial endpoints:

POST /payments
GET  /health

Acceptance Criteria

Both services run independently.

Order Service and Payment Service use separate ports.

Order Service can communicate with Payment Service through HTTP.

A successful order request produces a successful payment response.

Payment Service failure is handled by Order Service.

Both health endpoints work.

The developer understands the request/response flow.

Do Not Build

Docker

Redis

BullMQ

MongoDB

React

React Flow

Socket.io

AI

Load testing

Authentication

Phase 1.5 — Code Structure and Separation of Responsibilities

Goal

Refactor the basic services into a maintainable structure after the underlying request/response flow is understood.

Technologies

No new major technology.

Continue using:

Node.js

Express

HTTP

Axios

Responsibilities

Separate:

Routes

Controllers

Service logic

Server setup

Error-handling responsibilities where appropriate

Example:

src/
├── index.js
├── routes/
├── controllers/
└── services/

The exact structure should remain simple and should not introduce unnecessary abstraction.

Acceptance Criteria

Existing APIs continue working.

Order-to-Payment communication still works.

Routes are separated from controller logic.

Service-to-service communication is separated where appropriate.

Existing failure handling is preserved.

Centralized error handling is clear where introduced.

The developer understands why routes, controllers, and services are separated.

Do Not Build

Docker

Redis

BullMQ

MongoDB

React

Socket.io

AI

Load testing

Authentication

Phase 2 — Dockerized Microservice Environment

Goal

Run the microservices inside isolated containers and establish controlled service networking.

Technologies

Docker

Dockerfiles

Docker Compose

Container networking

Architecture

Docker Environment
│
├── Order Service
│
└── Payment Service

Deliverables

Dockerfile for Order Service

Dockerfile for Payment Service

Docker Compose configuration

Service-to-service communication through the container network

Environment-based configuration

Acceptance Criteria

Both services can be started using Docker.

Each service runs in its own container.

Order Service can communicate with Payment Service.

Services do not depend on local localhost assumptions inside containers.

The developer understands images, containers, ports, networks, and Docker Compose.

Do Not Build

Redis

BullMQ

Fault injection

MongoDB

React

Socket.io

AI

Load testing

Phase 3 — Controlled Fault Injection

Goal

Introduce the first controlled chaos experiments into the microservice environment.

Initial Fault Types

Latency

Artificially delay a service response.

Example:

Normal:

Order → Payment → 100ms

Chaos:

Order → Payment → 3000ms

Error

Make a service intentionally return an error.

Service Failure

Make a target service unavailable in a controlled manner.

Acceptance Criteria

The system can intentionally reproduce controlled failures.

For each supported fault:

The target service is clearly identified.

The fault configuration is explicit.

The experiment can be started and stopped safely.

The resulting behavior can be observed.

Normal behavior can be restored.

Fault behavior does not affect services outside the intended environment.

Do Not Build

Redis

BullMQ

MongoDB

React dashboard

Socket.io

AI

Load testing

Experiment history

Phase 4 — ChaosGuard Experiment API

Goal

Move experiment control into ChaosGuard instead of manually modifying service code.

Conceptual API

POST /experiments
GET  /experiments
GET  /experiments/:id
POST /experiments/:id/start
POST /experiments/:id/stop

Example experiment configuration:

{
  "service": "payment",
  "fault": "latency",
  "value": 3000,
  "duration": 30
}

Responsibilities

The experiment API should:

Validate experiment configuration.

Identify the target service.

Identify the fault type.

Validate fault parameters.

Create an experiment request.

Track experiment state.

Start the appropriate experiment execution mechanism.

Stop an experiment when requested.

Ensure the target fault can be removed.

Experiment Lifecycle

The current phase may use in-memory experiment state:

PENDING
   ↓
RUNNING
   ↓
COMPLETED

with appropriate failure handling.

The lifecycle may evolve when asynchronous execution is introduced.

Acceptance Criteria

A user/system can request an experiment through an API rather than manually changing service code.

The system can:

Create an experiment.

Retrieve an experiment.

Start an experiment.

Stop an experiment.

Apply a controlled fault.

Remove the fault after completion.

Report experiment status.

Do Not Build

Redis

BullMQ

Worker process

AI analysis

MongoDB

Vector search

Frontend

Load testing

Phase 5 — Redis + BullMQ + Experiment Worker

Goal

Move potentially long-running experiment execution out of the synchronous API request path.

Technologies

Redis

BullMQ

Worker process

Architecture

ChaosGuard Backend
       |
       v
     BullMQ
       |
       v
      Redis
       |
       v
 Experiment Worker
       |
       v
Microservice Environment

Worker Responsibilities

Receive experiment jobs.

Validate job information.

Execute the requested experiment.

Activate the requested fault.

Track experiment state.

Wait for the configured duration.

Collect relevant experiment information.

Remove the fault.

Mark the experiment complete or failed.

Important Safety Requirement

The worker must not assume that a successful queue operation guarantees fault cleanup.

The implementation should explicitly consider:

What happens if the worker crashes after activating a fault?

What happens if fault activation succeeds but the worker fails before cleanup?

How can a target service eventually return to a safe state?

The exact cleanup mechanism should be designed before implementation.

Acceptance Criteria

Experiment requests can be placed into a queue.

Worker processes queued experiments.

Experiment status can be tracked.

Worker execution occurs outside the API request path.

Successful experiments remove their injected faults.

Failed execution paths are handled appropriately.

The developer understands why a queue and worker are needed.

Do Not Build

React dashboard

React Flow

Socket.io

MongoDB

Load testing

AI

Additional microservices

Phase 6 — Expand Controlled Microservice Environment

Goal

Expand the controlled environment so that ChaosGuard can demonstrate more meaningful dependency graphs and failure propagation.

New Services

Introduce:

Auth Service

Inventory Service

Target topology:

                 Auth
                  |
                  v
                Order
               /     \
              v       v
          Payment   Inventory

The exact dependency relationships should be kept simple and understandable.

Responsibilities

Auth Service

Provide authentication-related behavior and an additional independent service boundary.

Inventory Service

Provide inventory-related behavior and create another dependency from Order.

Acceptance Criteria

Auth runs independently.

Inventory runs independently.

Existing Order and Payment behavior continues to work.

New dependencies are explicitly defined.

Services can be individually health-checked.

At least one meaningful failure-propagation scenario can be demonstrated beyond the original two-service system.

Existing experiments still work against supported targets.

Do Not Build

React Flow

Socket.io

MongoDB

Advanced metrics

Load testing

AI

Generic external-service integration

Phase 7 — React Dashboard

Goal

Create the user-facing ChaosGuard dashboard.

Technologies

React

Existing backend APIs

Initial UI

The dashboard should provide:

Service list

Service health

Experiment configuration

Experiment creation

Experiment execution controls

Experiment status

Basic experiment results

User Flow

Open Dashboard
      ↓
View Services
      ↓
Create Experiment
      ↓
Select Target
      ↓
Select Fault
      ↓
Configure Parameters
      ↓
Create
      ↓
Start
      ↓
View Status
      ↓
View Results

Acceptance Criteria

A user can:

Open the dashboard.

View available services.

Configure an experiment.

Create an experiment.

Start an experiment.

View its status.

View the resulting information.

The frontend should communicate with the backend through APIs.

Do Not Build

React Flow initially

Socket.io

Advanced metrics visualization

Experiment comparison

AI analysis

RAG/vector search

Phase 8 — React Flow Topology

Goal

Visually represent the microservice topology and dependencies.

Technology

React Flow

Example

         Auth 🟢
            |
            v
         Order 🟡
          /   \
         v     v
 Payment 🔴  Inventory 🟢

Responsibilities

The topology should show:

Services

Dependencies

Service health

Experiment impact

Failure propagation

Recovery state

Acceptance Criteria

The user can visually understand:

Which service was targeted.

Which services depend on it.

Which services were affected.

Which services remain healthy.

How the observed failure propagated through the topology.

React Flow should remain a visualization layer and should not contain experiment execution logic.

Phase 9 — Real-Time Experiment Updates

Goal

Allow the dashboard to update while experiments are running.

Technology

Socket.io

Event Examples

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

Architecture

Experiment Worker
       |
       v
ChaosGuard Backend
       |
       | Socket.io
       v
React Dashboard

Acceptance Criteria

The dashboard receives live experiment state changes.

The topology can react to experiment events.

Users do not need to repeatedly refresh the page to see experiment progress.

Events represent actual experiment state changes.

Phase 10 — Controlled Load Testing and Metrics

Goal

Measure the actual impact of chaos rather than relying only on service status.

Technologies

Controlled load-generation mechanism

Application-level metrics

Existing experiment infrastructure

The exact load-testing tool should be selected when this phase is designed.

Measurements

Initial useful measurements may include:

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

Experiment Measurement Model

The system should distinguish:

Baseline
   ↓
Chaos
   ↓
Recovery

Example:

                 Baseline    Chaos    Recovery

p95 latency        100ms     3000ms     120ms
error rate           0%        30%        2%

The values above are illustrative only.

Acceptance Criteria

Controlled traffic can be generated against the intended environment.

Experiments produce measurable observations.

Baseline and chaos measurements can be distinguished.

Recovery behavior can be measured.

Metrics shown to users correspond to actual collected data.

Load generation remains limited to the controlled environment.

Do Not Build

AI analysis

Generic monitoring platform

Distributed tracing unless specifically required

Uncontrolled external load generation

Phase 11 — MongoDB Persistence and Experiment History

Goal

Persist experiments and their results so that experiment history survives application restarts.

Technology

MongoDB

Initial Data

Potential persisted data:

Experiments

Experiment results

Experiment configurations

Experiment events

Service information

Metric summaries

Experiment History

The system should allow users to review:

Experiment ID

Target service

Fault type

Duration

Status

Date/time

Key metrics

Affected services

Acceptance Criteria

The system can persist:

Experiment configuration

Experiment status

Experiment results

Relevant events

Relevant metric summaries

Service information

Experiments remain available after application restarts.

The database should provide persistence but should not become responsible for experiment execution logic.

Phase 12 — Resilience Testing Loop and Experiment Comparison

Goal

Turn ChaosGuard from a system that only breaks services into a system that can evaluate resilience improvements through repeatable experiments.

Core Loop

1. Establish baseline
        ↓
2. Run chaos experiment
        ↓
3. Measure impact
        ↓
4. Identify resilience weakness
        ↓
5. Apply resilience improvement
        ↓
6. Run the same or comparable experiment
        ↓
7. Measure impact again
        ↓
8. Compare results

Resilience Mechanisms

The controlled services may eventually be modified to test mechanisms such as:

Timeouts

Retries

Circuit breakers

Fallbacks

Dependency isolation

Rate limiting

ChaosGuard does not need to implement every resilience mechanism itself.

The developer applies the resilience change to the controlled service and then uses ChaosGuard to rerun the experiment.

Experiment Comparison

The system should compare actual recorded results.

Potential comparison fields:

p50 latency

p95 latency

p99 latency

Error rate

Timeout count

Throughput

Recovery time

Number of affected services

Blast radius

Acceptance Criteria

A completed experiment can be stored as a baseline/reference.

A comparable experiment can be run later.

Results can be displayed side by side.

Differences are based on actual recorded measurements.

The user can determine how system behavior changed under the tested failure condition.

The same or comparable experiment configuration can be reproduced.

Phase 13 — Safety, Reliability, Testing, Deployment and Polish

Goal

Turn the working prototype into a polished, reproducible portfolio project.

13.1 Experiment Safety

Implement and verify:

Target validation

Fault validation

Duration limits

Fault cleanup

Controlled termination

Safe failure handling

Protection against invalid experiment combinations

Clear experiment lifecycle states

Consider concurrency conflicts when multiple experiments target the same service.

A known limitation is that a simple runtime fault state may allow one experiment to overwrite another.

Do not introduce a complex concurrency model unless concurrent experiments are actually required.

13.2 Worker Failure Handling

Test scenarios such as:

Worker failure before fault activation

Worker failure after fault activation

Target service failure during an experiment

Fault cleanup failure

Queue/job failure

The architecture should provide a clear strategy for eventually restoring the target service to a safe state.

13.3 Testing

Implement appropriate:

Unit tests

API tests

Integration tests

Failure scenario tests

Experiment lifecycle tests

Worker tests

Fault cleanup tests

The project should test not only successful execution but also failure paths.

13.4 Error Handling

Improve handling for:

Invalid experiment configuration

Unsupported target services

Unsupported fault types

Invalid fault parameters

Target-service failures

Timeouts

Worker failures

Redis failures

Database failures

Cleanup failures

13.5 Security

Implement appropriate:

Secret management

Input validation

Internal endpoint protection

API protection where appropriate

Experiment safety boundaries

Controlled target access

13.6 Observability

Improve:

Structured logging

Experiment logs

Service health information

Useful metrics

Worker logs

Fault lifecycle logs

Experiment event history

13.7 UI Polish

Improve:

Consistent design system

Loading states

Error states

Experiment progress

Clear topology visualization

Metrics visualization

Experiment history

Experiment comparison

Responsive design

13.8 Documentation

Maintain:

README

Architecture diagram

Setup instructions

Experiment examples

Technical decisions

Screenshots/demo

Explanation of the resilience-testing loop

Documentation should describe the actual implementation rather than the intended future architecture.

13.9 Deployment

Deploy only after the local architecture is stable.

Deployment should preserve the controlled nature of experiments.

The project should not be presented as a production-grade chaos platform.

Optional Future Phase — AI-Assisted Experiment Analysis

AI is optional and is not part of the core ChaosGuard roadmap.

If implemented later, it should analyze actual experiment data rather than generic chaos-engineering knowledge alone.

Possible Inputs

Experiment configuration

Observed metrics

Experiment events

Affected services

Failure propagation

Experiment history

Service dependency information

Possible Outputs

Explanation of observed behavior

Identification of important dependencies

Risk observations

Possible contributing factors

Resilience mechanisms to investigate

Important Boundary

The AI system must not autonomously execute destructive experiments.

The intended flow is:

Observed Experiment Data
          ↓
Optional AI Analysis
          ↓
Explanation / Recommendations

AI should remain an analysis layer rather than becoming the core identity of ChaosGuard.

Phase Completion Rules

A phase is complete only when:

The required functionality has been implemented.

The functionality has been tested.

Required failure scenarios have been tested.

The implementation matches the architecture.

The acceptance criteria are satisfied.

Documentation reflects the actual implementation.

memory.md is updated once implementation begins.

The developer understands the major concepts introduced in that phase.

A phase should not be considered complete merely because the code compiles.

Phase Transition Rule

Before moving to the next phase:

Implement
   ↓
Test
   ↓
Understand
   ↓
Review
   ↓
Document
   ↓
Update memory.md
   ↓
Move to next phase

Do not skip the understanding and verification steps.

Current Development Status

The currently implemented system has progressed through:

Phase 0 — Project Foundation
Phase 1 — Basic Microservices
Phase 1.5 — Code Structure
Phase 2 — Dockerized Microservice Environment
Phase 3 — Controlled Fault Injection
Phase 4 — ChaosGuard Experiment API

Phase 4 is the current completed implementation stage.

The current system contains:

ChaosGuard API
      |
      +------ Order Service
      |          |
      |          v
      |     Payment Service
      |
      +------ Experiment Management

The current experiment system uses in-memory experiment state.

The next development phase is:

Phase 5 — Redis + BullMQ + Experiment Worker

The project should not implement later phases before Phase 5 is understood, designed, implemented, tested, and documented.

Final Development Philosophy

ChaosGuard should be developed as:

Understand
   ↓
Design
   ↓
Implement
   ↓
Test
   ↓
Observe
   ↓
Document
   ↓
Understand Again
   ↓
Next Phase

The project should prioritize:

Depth of understanding

Architectural coherence

Controlled experimentation

Measurable results

Repeatability

Safe failure injection

Clear service boundaries

Incremental complexity

over:

Number of technologies

Unnecessary abstractions

Premature AI integration

Generic RAG systems

Features that do not contribute to the chaos-engineering workflow

The final project should demonstrate a coherent reliability-engineering workflow:

Build a distributed system
        ↓
Introduce controlled failure
        ↓
Observe failure propagation
        ↓
Measure impact
        ↓
Identify weakness
        ↓
Improve resilience
        ↓
Rerun experiment
        ↓
Compare results