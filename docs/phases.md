ChaosGuard — Development Phases

1. Purpose

This document defines the incremental development roadmap for ChaosGuard.

ChaosGuard must be built one phase at a time.

Each phase introduces only the technologies and complexity required at that stage.

A phase must satisfy its acceptance criteria before the project moves to the next phase.

Future-phase features must not be implemented early unless explicitly approved.

---

Phase 0 — Project Foundation

Goal

Establish the project structure, documentation, development rules, and Git repository.

Deliverables

- Project repository
- "README.md"
- ".gitignore"
- "docs/prd.md"
- "docs/architecture.md"
- "docs/rules.md"
- "docs/phases.md"
- "docs/design.md"
- Git initialized

Technologies

- Git
- Node.js development environment

Do Not Build

- Docker
- Redis
- MongoDB
- React
- AI
- RAG
- Fault injection

Acceptance Criteria

- Documentation exists and describes the intended product.
- Development rules are defined.
- Development phases are defined.
- Repository has a clean initial structure.

---

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

- Node.js
- Express
- HTTP
- JSON
- Axios
- npm

Order Service

Responsibilities:

- Receive order requests.
- Validate basic order input.
- Generate a temporary order ID.
- Request payment processing from Payment Service.
- Return the payment result to the client.
- Handle Payment Service failures.

Initial endpoints:

POST /orders
GET  /health

Payment Service

Responsibilities:

- Receive payment requests.
- Validate basic payment input.
- Generate a temporary payment ID.
- Return a simulated successful payment response.

Initial endpoints:

POST /payments
GET  /health

Acceptance Criteria

- Both services run independently.
- Order Service and Payment Service use separate ports.
- Order Service can communicate with Payment Service through HTTP.
- A successful order request produces a successful payment response.
- Payment Service failure is handled by Order Service.
- Both health endpoints work.
- The developer understands the request/response flow.

Do Not Build

- Docker
- Redis
- BullMQ
- MongoDB
- React
- React Flow
- Socket.io
- RAG
- Vector search
- LLM integration
- Authentication

---

Phase 1.5 — Code Structure and Separation of Responsibilities

Goal

Refactor the basic services into a maintainable structure after the underlying request/response flow is understood.

Technologies

No new major technology.

Continue using:

- Node.js
- Express
- HTTP
- Axios

Responsibilities

Separate:

Routes
Controllers
Service logic
Server setup

Example:

src/
├── index.js
├── routes/
├── controllers/
└── services/

The exact structure should remain simple and should not introduce unnecessary abstraction.

Acceptance Criteria

- Existing APIs continue working.
- Order-to-Payment communication still works.
- Routes are separated from controller logic.
- Service-to-service communication is separated where appropriate.
- Existing failure handling is preserved.
- The developer understands why routes, controllers, and services are separated.

Do Not Build

- Docker
- Redis
- BullMQ
- MongoDB
- React
- Socket.io
- AI
- RAG
- Authentication

---

Phase 2 — Dockerized Microservice Environment

Goal

Run the microservices inside isolated containers and establish controlled service networking.

Technologies

- Docker
- Dockerfiles
- Docker Compose
- Container networking

Architecture

Docker Environment
│
├── Order Service
│
└── Payment Service

Deliverables

- Dockerfile for Order Service
- Dockerfile for Payment Service
- Docker Compose configuration
- Service-to-service communication through the container network
- Environment-based configuration

Acceptance Criteria

- Both services can be started using Docker.
- Each service runs in its own container.
- Order Service can communicate with Payment Service.
- Services do not depend on local "localhost" assumptions inside containers.
- The developer understands images, containers, ports, networks, and Docker Compose.

Do Not Build

- Redis
- BullMQ
- Fault injection
- MongoDB
- React
- AI

---

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

- The target service is clearly identified.
- The fault configuration is explicit.
- The experiment can be started and stopped safely.
- The resulting behavior can be observed.
- Normal behavior can be restored.

Do Not Build

- AI
- RAG
- MongoDB
- React dashboard
- BullMQ

---

Phase 4 — ChaosGuard Experiment API

Goal

Move experiment control into ChaosGuard instead of manually modifying service code.

Conceptual API

POST /experiments

Example request:

{
  "service": "payment",
  "fault": "latency",
  "value": 3000
}

Responsibilities

The experiment API should:

- Validate experiment configuration.
- Identify the target service.
- Identify the fault type.
- Validate fault parameters.
- Create an experiment request.
- Start the appropriate experiment execution mechanism.

Acceptance Criteria

A user/system can request an experiment through an API rather than manually changing service code.

Do Not Build

- Queue infrastructure yet unless explicitly required by implementation.
- AI analysis
- RAG
- Vector search
- Frontend

---

Phase 5 — Redis + BullMQ + Experiment Worker

Goal

Move potentially long-running experiment execution out of the synchronous API request path.

Technologies

- Redis
- BullMQ
- Worker process

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

- Receive experiment jobs.
- Validate job information.
- Execute the requested experiment.
- Track experiment state.
- Collect relevant results.
- Mark the experiment complete or failed.

Acceptance Criteria

- Experiment requests can be placed into a queue.
- Worker processes queued experiments.
- Experiment status can be tracked.
- Failed jobs are handled appropriately.
- API is not responsible for directly performing long-running experiment work.

Do Not Build

- AI
- RAG
- Vector search
- Complex frontend

---

Phase 6 — React Dashboard

Goal

Create the user-facing ChaosGuard dashboard.

Technologies

- React
- Existing backend APIs

Initial UI

The dashboard should provide:

- Service list
- Experiment configuration
- Experiment execution controls
- Experiment status
- Basic results

Acceptance Criteria

A user can:

1. Open the dashboard.
2. View available services.
3. Configure an experiment.
4. Start an experiment.
5. View its status.
6. View the resulting information.

The frontend should communicate with the backend through APIs.

Do Not Build

- React Flow initially
- RAG
- AI analysis
- Advanced visualization

---

Phase 7 — React Flow Topology

Goal

Visually represent the microservice topology and dependencies.

Technology

- React Flow

Example

        Auth 🟢
           |
           v
       Order 🟡
        /    \
       v      v
 Payment 🔴  Inventory 🟢

Responsibilities

The topology should show:

- Services
- Dependencies
- Service health
- Experiment impact
- Failure propagation

Acceptance Criteria

The user can visually understand:

- Which service was targeted.
- Which services depend on it.
- Which services were affected.

---

Phase 8 — Real-Time Experiment Updates

Goal

Allow the dashboard to update while experiments are running.

Technology

- Socket.io

Event Examples

experiment_started
fault_injected
service_degraded
service_failed
dependency_affected
experiment_completed

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

The dashboard can receive and display live experiment state changes without requiring constant manual refresh.

---

Phase 9 — MongoDB Persistence

Goal

Persist experiment and system information.

Technology

- MongoDB

Initial Data

Potential collections/documents:

Experiments
Experiment Results
Services
Events
Experiment Configurations
Knowledge Documents

Acceptance Criteria

The system can persist:

- Experiment configuration
- Experiment status
- Experiment results
- Relevant events
- Service information

Experiments should remain available after the application restarts.

---

Phase 10 — Knowledge Base + Vector Search

Goal

Build the knowledge retrieval foundation for the AI system.

Technologies

- MongoDB Vector Search
- Embeddings
- Knowledge documents

Pipeline

Engineering Documents
        |
        v
Chunking
        |
        v
Embeddings
        |
        v
Vector Storage
        |
        v
Semantic Retrieval

Knowledge Topics

Initial knowledge can include:

- Timeouts
- Retries
- Circuit breakers
- Fallbacks
- Rate limiting
- Dependency isolation
- Resilience patterns
- Chaos engineering principles

Acceptance Criteria

Given an experiment-related query, the system can retrieve semantically relevant engineering knowledge.

Do Not Build

- Fully autonomous AI
- Autonomous experiment execution

---

Phase 11 — AI-Assisted Analysis

Goal

Use experiment observations and retrieved engineering knowledge to produce useful analysis and recommendations.

Inputs

Experiment Configuration
+
Observed Events
+
Metrics
+
Affected Services
+
Failure Propagation
+
Retrieved Knowledge

Pipeline

Experiment Result
       |
       v
Retrieve Relevant Knowledge
       |
       v
LLM
       |
       v
Analysis
       |
       v
Risk + Explanation + Recommendations

Example Output

Risk: HIGH

Reason:
Payment is a critical dependency of Order Service.

Impact:
Injected latency caused increased Order latency
and downstream timeouts.

Recommendations:
- Add timeout handling
- Consider circuit breaker protection
- Implement fallback behavior
- Test complete Payment failure

Acceptance Criteria

The AI can:

- Explain observed behavior.
- Identify important dependencies.
- Identify risks.
- Connect recommendations to observed behavior.
- Use retrieved knowledge as additional context.

The AI must clearly distinguish observed facts from generated recommendations.

---

Phase 12 — Testing, Security, Deployment and Polish

Goal

Turn the working prototype into a polished portfolio project.

Areas

Testing

- Unit tests
- API tests
- Integration tests
- Failure scenario tests
- Experiment lifecycle tests

Error Handling

- Better validation
- Dependency failures
- Timeouts
- Worker failures
- Database failures

Security

- Secret management
- Input validation
- API protection where appropriate
- Experiment safety boundaries

Observability

- Structured logging
- Experiment logs
- Service health
- Useful metrics

UI Polish

- Consistent design system
- Loading states
- Error states
- Experiment progress
- Clear topology visualization
- Responsive design

Documentation

- README
- Architecture diagram
- Setup instructions
- Experiment examples
- Technical decisions
- Screenshots/demo

Deployment

Deploy only after the local architecture is stable.

---

Phase Completion Rules

A phase is complete only when:

1. The required functionality has been implemented.
2. The functionality has been tested.
3. Required failure scenarios have been tested.
4. The implementation matches the architecture.
5. The acceptance criteria are satisfied.
6. Documentation reflects the actual implementation.
7. "memory.md" is updated once implementation begins.
8. The developer understands the major concepts introduced in that phase.

A phase should not be considered complete merely because the code compiles.

---

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

---

Current Development Status

At the beginning of the project documentation stage:

Phase 0 — Project Foundation

The project documentation consists of:

docs/
├── prd.md
├── architecture.md
├── rules.md
├── phases.md
└── design.md

The initial two-service implementation may exist as a learning/prototype implementation, but Phase 1 should be formally reviewed against the documented architecture before being considered complete.

"memory.md" should be introduced when implementation work formally begins and then updated regularly.

---

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
Understand again
   ↓
Next phase

The project should prioritize depth of understanding and architectural coherence over the number of technologies used.