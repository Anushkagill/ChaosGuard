# ChaosGuard — Product Requirements Document

## 1. Product Overview

ChaosGuard is an AI-assisted chaos engineering platform designed around a controlled microservice environment.

The platform allows a user to intentionally introduce controlled failures into individual services, observe how those failures propagate through dependent services, visualize the impact in real time, and use AI-assisted analysis to understand the failure and recommend resilience improvements.

The project is designed as a learning-focused but technically realistic distributed-systems project demonstrating:

- Microservices
- HTTP-based service communication
- Fault injection
- Distributed-system failure propagation
- Dockerized environments
- Asynchronous experiment execution
- Queues and workers
- Real-time communication
- Database persistence
- Vector search
- Retrieval-Augmented Generation (RAG)
- AI-assisted system analysis

ChaosGuard is not intended to compete with production-grade chaos engineering platforms. Its purpose is to demonstrate a strong understanding of distributed systems, backend engineering, chaos engineering, AI/RAG, and system observability in one coherent project.

---

## 2. Problem Statement

Modern applications are often composed of multiple interconnected services.

A failure in one service can affect other services through their dependencies.

For example:

Order Service
    |
    v
Payment Service

If Payment becomes unavailable or significantly slower, Order may also become slow or fail.

Traditional functional testing mainly asks:

"Does the system work when everything is operating normally?"

Chaos engineering asks:

"What happens when part of the system fails?"

The problem ChaosGuard addresses is the difficulty of safely experimenting with these failures, observing their propagation, and understanding the resulting system behavior.

ChaosGuard provides a controlled environment where these failures can be intentionally introduced and analyzed.

---

## 3. Product Goal

The primary goal of ChaosGuard is to provide a controlled platform where users can:

1. View a microservice environment.
2. Select a service to experiment on.
3. Select and configure a failure type.
4. Run a controlled chaos experiment.
5. Observe the resulting system behavior.
6. Identify affected and dependent services.
7. View experiment results and metrics.
8. Receive AI-assisted analysis.
9. Receive resilience recommendations grounded in relevant engineering knowledge.

---

## 4. Target Users

### Primary User

Developers and students learning or working with:

- Distributed systems
- Microservices
- Backend engineering
- Reliability engineering
- Chaos engineering
- Cloud-native systems

### Secondary Users

Engineering teams or learners who want a controlled environment for experimenting with service failures and understanding failure propagation.

ChaosGuard is primarily designed as a developer/engineering learning and experimentation platform rather than a general consumer product.

---

## 5. Core User Journey

The primary user journey is:

User opens ChaosGuard
        |
        v
Views microservice topology
        |
        v
Selects a service
        |
        v
Selects a fault type
        |
        v
Configures the fault
        |
        v
Runs the experiment
        |
        v
System executes the controlled failure
        |
        v
Failure propagation is observed
        |
        v
Results and affected services are displayed
        |
        v
Relevant engineering knowledge is retrieved
        |
        v
AI analyzes the experiment
        |
        v
User receives explanation and resilience recommendations

---

## 6. Core Features

### 6.1 Microservice Topology

The platform should represent the controlled microservice environment and its dependencies.

Example:

Auth
  |
  v
Order
 /   \
v     v
Payment  Inventory

The topology should allow the user to understand which services depend on one another.

---

### 6.2 Controlled Fault Injection

Users should be able to intentionally introduce controlled failures into supported services.

Initial fault types:

- Latency
- Errors
- Service failure/unavailability

Example:

Normal:

Order → Payment → 100ms

Experiment:

Order → Payment → 3000ms

The system should control the experiment rather than allowing arbitrary uncontrolled failures.

---

### 6.3 Experiment Configuration

Users should be able to configure an experiment using parameters appropriate to the selected fault.

For example:

Service:
Payment

Fault:
Latency

Value:
3000 ms

The experiment should clearly communicate what will be changed before execution.

---

### 6.4 Experiment Execution

The platform should execute the requested experiment in the controlled environment.

Experiment execution should be separated from the API request path when experiments become long-running.

The eventual architecture should support asynchronous experiment execution using a queue and worker system.

---

### 6.5 Real-Time Experiment Updates

The platform should provide live updates while an experiment is running.

Examples:

- Experiment started
- Fault injected
- Service degraded
- Service failed
- Dependent service affected
- Experiment completed

The final platform should use real-time communication to update the dashboard.

---

### 6.6 Failure Propagation Visualization

The platform should visually communicate how a failure spreads through service dependencies.

Example:

Payment 🔴
    |
    v
Order 🟡

The visualization should make it easy to identify:

- The service where the fault originated
- Directly affected services
- Indirectly affected services
- Current service health

---

### 6.7 Experiment Results

After an experiment, the platform should provide a report containing information such as:

- Experiment configuration
- Target service
- Fault type
- Fault parameters
- Experiment status
- Affected services
- Observed behavior
- Relevant metrics
- Failure propagation
- Risk assessment

---

### 6.8 AI-Assisted Analysis

The AI layer should analyze the experiment and explain:

- What happened
- Why it happened
- Which dependencies were important
- Which services were affected
- Why the failure propagated
- What risks were revealed

Example:

Risk: HIGH

Reason:
Payment is a critical dependency of Order Service.

Impact:
Injected Payment latency caused increased Order latency and eventual timeouts.

---

### 6.9 RAG-Grounded Recommendations

The AI system should retrieve relevant engineering knowledge before generating resilience recommendations.

The system should use retrieved knowledge related to topics such as:

- Timeouts
- Retries
- Circuit breakers
- Fallbacks
- Rate limiting
- Dependency isolation
- Resilience patterns

The purpose of RAG is to make recommendations more grounded in relevant engineering knowledge rather than relying only on the language model's general knowledge.

---

## 7. Initial Microservice Environment

The controlled environment will begin with a minimal system:

Order Service
      |
      v
Payment Service

Additional services such as:

- Auth
- Inventory
- Notification

may be introduced later as the project evolves.

The initial two-service system exists specifically to make the underlying service communication and failure propagation easy to understand before introducing additional complexity.

---

## 8. Non-Functional Requirements

### Reliability

Experiments must be controlled and should not unintentionally affect systems outside the intended experimental environment.

### Observability

The system should provide enough information to understand what happened during an experiment.

### Modularity

Services and major components should remain independently understandable and replaceable.

### Extensibility

The architecture should allow additional:

- Services
- Fault types
- Experiment configurations
- Resilience rules
- AI analysis capabilities

to be added without rewriting the entire application.

### Safety

Chaos experiments must be explicitly controlled.

The AI analysis system must not autonomously execute destructive experiments.

### Maintainability

The codebase should use clear boundaries and avoid unnecessary complexity or premature abstractions.

---

## 9. MVP Scope

The MVP should demonstrate the complete basic concept:

1. A controlled microservice environment.
2. Service-to-service communication.
3. Controlled fault injection.
4. Experiment execution.
5. Failure observation.
6. Failure propagation visualization.
7. Experiment results.
8. AI-assisted analysis.
9. RAG-grounded resilience recommendations.

The MVP should prioritize a coherent end-to-end experience over a large number of features.

---

## 10. Out of Scope

The following are outside the initial product scope:

- Production-grade enterprise chaos engineering
- Multi-cloud infrastructure management
- Autonomous destructive experimentation
- Managing arbitrary external infrastructure
- Replacing established production chaos platforms
- Fully autonomous AI decision-making
- Building a general-purpose monitoring platform

ChaosGuard should remain focused on controlled experimentation and analysis within its designed environment.

---

## 11. Future Scope

Potential future improvements include:

- Additional microservices
- Additional fault types
- Network-level failures
- Resource exhaustion experiments
- More advanced metrics
- Experiment history
- Experiment comparison
- More resilience patterns
- Advanced topology analysis
- More sophisticated AI reasoning
- Deployment to cloud infrastructure
- Authentication and multi-user support

These features should only be introduced after the core system is stable.

---

## 12. Success Criteria

ChaosGuard will be considered successful when a user can:

1. Open the platform and understand the service topology.
2. Select a service and configure a controlled fault.
3. Execute an experiment.
4. Observe the target service and dependent services changing state.
5. Understand how the failure propagated.
6. View the experiment results.
7. Receive an understandable AI-generated explanation.
8. Receive relevant resilience recommendations.
9. Understand why those recommendations apply to the observed failure.

The final system should demonstrate not only that an experiment can be executed, but also that the user can understand the resulting system behavior.