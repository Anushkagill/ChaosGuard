ChaosGuard — System Architecture

1. Purpose

This document defines the technical architecture of ChaosGuard.

It describes:

- The major components of the system
- Responsibilities of each component
- How components communicate
- How experiments are executed
- How failures propagate
- How experiment data flows through the system
- Why each major technology is used
- The difference between the current implementation and the planned final architecture

The architecture must evolve incrementally.

A technology should only be introduced when the current phase requires it.

---

2. Architecture Principles

2.1 Incremental Development

ChaosGuard must be built phase by phase.

The project should not implement the complete final architecture at the beginning.

Each phase should introduce only the technologies and complexity required for that phase.

---

2.2 Independent Services

The experimental environment is based on independently running microservices.

Each service should:

- Have a clearly defined responsibility
- Be independently runnable
- Be independently testable
- Communicate through defined interfaces
- Be capable of failing independently

---

2.3 Controlled Failure

Chaos experiments must be intentionally triggered and controlled.

ChaosGuard should never randomly or autonomously introduce destructive failures into an uncontrolled environment.

The experiment system must know:

- Which service is targeted
- Which fault is being injected
- What parameters are being used
- When the experiment starts
- When the experiment ends

---

2.4 Separation of Concerns

Different parts of the system should have different responsibilities.

For example:

Frontend
→ user interaction and visualization

Backend
→ API and experiment orchestration

Queue
→ asynchronous experiment jobs

Worker
→ actual experiment execution

Microservices
→ application behavior

Database
→ persistence

RAG
→ retrieval of relevant engineering knowledge

LLM
→ analysis and recommendations

The AI layer should not become responsible for executing the underlying experiment.

---

3. High-Level Final Architecture

The planned final architecture is:

                              USER
                                |
                                v
                       React Frontend
                                |
                    HTTP / Socket.io
                                |
                                v
                     ChaosGuard Backend
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
           Redis             MongoDB            AI / RAG
             |
           BullMQ
             |
             v
      Experiment Worker
             |
             v
       Docker Environment
             |
      +------+-------+----------------+
      |              |                |
      v              v                v
    Auth           Orders           Payment
                                      |
                                      v
                                  Inventory

This is the planned final architecture.

Not all components exist at the beginning.

---

4. Current Architecture

The initial implementation intentionally contains only two services:

                    HTTP
Order Service ----------------> Payment Service
    :3001                         :3002

Both services are currently:

- Node.js applications
- Express applications
- Independently runnable
- Running on separate ports
- Communicating through HTTP

The current implementation does not yet require:

- Docker
- Redis
- BullMQ
- Socket.io
- MongoDB
- React
- React Flow
- RAG
- Vector Search
- LLM APIs

---

5. Microservice Architecture

A microservice is an independently running application responsible for a specific capability.

The initial system contains:

Order Service
     |
     | Responsible for orders
     |
Payment Service
     |
     | Responsible for payments

Additional services may be introduced later.

Possible final services:

Auth Service
Order Service
Payment Service
Inventory Service

Each service should remain independently understandable and runnable.

---

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

- Whether Order fails
- Whether Order becomes slow
- Whether retries occur
- Whether requests time out
- Whether other dependent services are affected

This independent failure behavior is central to the purpose of ChaosGuard.

---

7. Node.js

Node.js is the backend runtime used for the initial microservices.

Its responsibility is to allow JavaScript code to run outside the browser.

For example:

Node.js
   |
   +---- Order Service
   |
   +---- Payment Service

Each service runs as its own Node.js process.

Node.js is used because it provides a lightweight environment for implementing HTTP-based services and fits well with the planned Node.js ecosystem used later in the project.

---

8. Express

Express is the HTTP server/application framework used with Node.js.

It simplifies:

- Creating HTTP servers
- Defining routes
- Handling requests
- Sending responses
- Adding middleware

Conceptually:

Application Code
       |
     Express
       |
     Node.js
       |
   Operating System

Example:

POST /orders

is defined through Express routing.

---

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

Therefore the two services are independently running programs.

---

10. Ports

Each service listens on a different port during local development.

Current configuration:

Order Service   → localhost:3001
Payment Service → localhost:3002

Therefore:

http://localhost:3001

refers to the Order Service.

And:

http://localhost:3002

refers to the Payment Service.

Ports allow multiple network applications to run on the same computer without competing for the same listening endpoint.

---

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

---

12. API Endpoints

The current services expose:

Order Service

POST /orders
GET  /health

Payment Service

POST /payments
GET  /health

The API contract should remain explicit and stable as the project evolves.

---

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

---

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

---

15. Service-to-Service Request Flow

A complete order request currently follows this flow:

1. Client sends POST /orders

2. Order Service receives the request.

3. Express parses the JSON body.

4. Order Service validates:
   - item
   - amount

5. Order Service creates an order ID.

6. Order Service sends an HTTP POST request
   to Payment Service using Axios.

7. Payment Service receives POST /payments.

8. Payment Service validates:
   - orderId
   - amount

9. Payment Service creates a payment ID.

10. Payment Service returns a JSON response.

11. Order Service receives the response.

12. Order Service returns the final response to the client.

---

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

Order Service handles the failure using error handling and returns an appropriate error response to the client.

This basic behavior provides the foundation for future chaos experiments.

---

17. Docker Architecture

Docker will be introduced after the local two-service architecture is understood.

The goal is to run services in isolated containers.

Planned structure:

Docker Environment
│
├── Order Service Container
│
├── Payment Service Container
│
├── Auth Service Container
│
├── Inventory Service Container
│
├── Redis Container
│
└── MongoDB Container

Docker should not be introduced merely for the sake of using Docker.

Its purpose is to create a controlled, reproducible environment where services can be independently started, stopped, and experimented on.

---

18. Container Networking

Once services are containerized, they should communicate through the Docker network rather than relying on local development assumptions.

For example, the logical communication may become:

Order Container
      |
      | HTTP
      v
Payment Container

Service discovery and configuration should use environment variables rather than hardcoded environment-specific addresses.

---

19. Fault Injection Architecture

ChaosGuard will eventually introduce controlled faults into services.

Initial fault types:

Latency
Error
Service Failure

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

---

20. Experiment API

The ChaosGuard backend will eventually expose an experiment API.

Conceptually:

POST /experiments

with information such as:

{
  "service": "payment",
  "fault": "latency",
  "value": 3000
}

The API should validate the experiment configuration before execution.

The experiment API should not directly contain all experiment execution logic.

---

21. Redis

Redis will eventually provide fast infrastructure for asynchronous experiment processing and related temporary state.

For ChaosGuard, Redis is primarily intended to support the experiment job system.

It may also support other infrastructure concerns when justified, such as:

- Temporary state
- Rate limiting
- Event-related infrastructure

Redis should not be introduced until the project reaches the phase that requires asynchronous experiment processing.

---

22. BullMQ

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

- Job creation
- Job processing
- Retries
- Delayed jobs
- Job status

---

23. Experiment Worker

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
Collect results/events
        |
        v
Mark experiment complete

The worker should not be responsible for frontend rendering or AI reasoning.

---

24. React Frontend

The final user interface will be built using React.

The frontend will allow users to:

- View services
- View topology
- Configure experiments
- Start experiments
- Monitor experiment progress
- View results
- Read AI analysis
- Read recommendations

The frontend communicates with the backend through APIs and real-time events.

---

25. React Flow

React Flow will be used to visualize the microservice topology.

Example:

        Auth 🟢
           |
           v
       Order 🟡
        /    \
       v      v
 Payment 🔴  Inventory 🟢

The graph should represent service dependencies and update based on observed experiment states.

React Flow is a visualization layer.

It should not contain the actual experiment execution logic.

---

26. Socket.io

HTTP follows a request/response model.

For real-time updates, ChaosGuard will use Socket.io.

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

experiment_started
fault_injected
service_degraded
service_failed
dependency_affected
experiment_completed

The frontend can use these events to update the topology and experiment status without repeatedly polling the backend.

---

27. MongoDB

MongoDB will eventually be used for persistent storage.

Potential stored information includes:

Experiments
Experiment Results
Events
Services
Experiment Configuration
Knowledge Documents

MongoDB is introduced only after the system has meaningful experiment data that needs to be persisted.

---

28. Vector Search

The RAG system will use vector search to retrieve semantically relevant engineering knowledge.

Conceptually:

Knowledge Document
       |
       v
Embedding
       |
       v
Vector Storage
       |
       v
Semantic Search

When an experiment occurs, the experiment information can be used to retrieve relevant resilience knowledge.

Example:

Experiment:
Payment latency caused Order timeout

may retrieve knowledge related to:

- Timeouts
- Circuit breakers
- Retries
- Fallbacks

---

29. RAG Architecture

RAG stands for Retrieval-Augmented Generation.

The planned flow is:

Experiment Result
       |
       v
Create Retrieval Query
       |
       v
Vector Search
       |
       v
Relevant Knowledge
       |
       v
LLM
       |
       v
Grounded Analysis

The retrieved knowledge provides additional context to the model.

The LLM should not be treated as the source of experiment truth.

Observed experiment data remains the primary source for describing what actually happened.

---

30. AI Analysis Layer

The AI layer is responsible for interpreting experiment results and generating explanations and recommendations.

Inputs may include:

Experiment Configuration
+
Observed Metrics
+
Affected Services
+
Failure Propagation
+
Retrieved Knowledge

Output may include:

Risk
Reason
Impact
Explanation
Recommendations

Example:

Risk: HIGH

Reason:
Payment is a critical dependency of Order.

Impact:
Injected latency increased Order response time
and caused downstream timeouts.

Recommendations:
- Introduce downstream timeout handling
- Consider circuit breaker protection
- Implement fallback behavior
- Test complete Payment failure

---

31. AI Boundary

AI is an analysis and recommendation layer.

It must not become the uncontrolled experiment executor.

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
AI / RAG
 |
 v
Explanation + Recommendations

The AI may recommend an experiment or resilience improvement, but execution must remain explicitly controlled by the experiment system.

---

32. Complete Final Experiment Flow

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
 | Create experiment job
 v
BullMQ / Redis
 |
 v
Experiment Worker
 |
 | Inject controlled fault
 v
Dockerized Microservices
 |
 | Failure propagation
 v
Events + Metrics
 |
 +--------------------+
 |                    |
 v                    v
Socket.io          Persistence
 |                    |
 v                    v
React Dashboard     MongoDB
 |
 v
Experiment Result
 |
 v
RAG Retrieval
 |
 v
Relevant Knowledge
 |
 v
LLM Analysis
 |
 v
Risk + Explanation + Recommendations
 |
 v
Final Experiment Report

---

33. Architecture Boundaries

The following boundaries should be maintained:

Frontend

Responsible for:

- UI
- User interaction
- Visualization
- Displaying results

Not responsible for:

- Executing chaos directly
- Database access
- AI model execution

---

ChaosGuard Backend

Responsible for:

- API
- Experiment configuration
- Validation
- Orchestration
- Communication between system components

Not responsible for:

- Rendering UI
- Performing all long-running experiment work directly

---

Worker

Responsible for:

- Executing experiment jobs
- Fault injection
- Experiment lifecycle

Not responsible for:

- UI rendering
- AI-generated recommendations

---

Database

Responsible for:

- Persistent data

Not responsible for:

- Business logic

---

RAG

Responsible for:

- Retrieving relevant knowledge

Not responsible for:

- Executing experiments
- Determining ground-truth system behavior

---

LLM

Responsible for:

- Analysis
- Explanation
- Recommendations

Not responsible for:

- Directly controlling infrastructure
- Autonomous destructive actions
- Replacing observed experiment data

---

34. Technology Introduction Order

Technologies should be introduced in this order:

Node.js
   ↓
Express
   ↓
HTTP
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
Worker
   ↓
React
   ↓
React Flow
   ↓
Socket.io
   ↓
MongoDB
   ↓
Vector Search
   ↓
RAG
   ↓
LLM / AI Analysis

A technology should not be added simply because it appears later in the final architecture.

It should be added when the corresponding phase requires it.

---

35. Current vs Final Architecture

Current

Client
  |
  v
Order Service
  |
  | HTTP / Axios
  v
Payment Service

Technologies currently required:

- Node.js
- Express
- HTTP
- Axios
- JSON

---

Planned Final System

React
  |
  v
ChaosGuard Backend
  |
  +---- Redis / BullMQ
  |
  +---- MongoDB
  |
  +---- Socket.io
  |
  +---- RAG / Vector Search / LLM
  |
  v
Experiment Worker
  |
  v
Dockerized Microservices

The final architecture must be reached incrementally.

---

36. Architecture Decision Principle

Every architectural decision should answer three questions:

1. What problem does this component solve?

2. Why is this technology appropriate for that problem?

3. Why are we introducing it at this stage?

If these questions cannot be answered clearly, the component should not be introduced yet.

---

37. Final Architectural Goal

ChaosGuard should demonstrate a coherent distributed system rather than a collection of unrelated technologies.

The final architecture should show a clear chain:

Microservices
      ↓
Dependencies
      ↓
Controlled Failures
      ↓
Failure Propagation
      ↓
Experiment Infrastructure
      ↓
Observation
      ↓
Persistence
      ↓
Knowledge Retrieval
      ↓
AI Analysis
      ↓
Resilience Recommendations

Every technology in the final stack must have a clear responsibility in this chain.