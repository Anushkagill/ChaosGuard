# ChaosGuard — Product Requirements Document

## 1. Product Overview

ChaosGuard is a chaos engineering platform designed around a controlled microservice environment.

The platform allows a user to intentionally introduce controlled failures into individual services, observe how those failures propagate through dependent services, visualize the impact in real time, measure the resulting system behavior, and evaluate whether resilience improvements actually improve system behavior.

The project is designed as a learning-focused but technically realistic distributed-systems and reliability-engineering project demonstrating:

- Microservices
- HTTP-based service communication
- Fault injection
- Distributed-system failure propagation
- Dockerized environments
- Asynchronous experiment execution
- Queues and workers
- Real-time communication
- Service topology visualization
- System metrics and observability
- Experiment history and comparison
- Resilience testing
- Controlled load testing

ChaosGuard is not intended to compete with production-grade chaos engineering platforms. Its purpose is to demonstrate a strong understanding of distributed systems, backend engineering, chaos engineering, reliability engineering, fault propagation, asynchronous systems, and system observability in one coherent project.

AI-assisted analysis may be introduced as an optional future capability for analyzing experiment results, but AI is not required for the core ChaosGuard architecture or experiment execution.

---

## 2. Problem Statement

Modern applications are often composed of multiple interconnected services.

A failure in one service can affect other services through their dependencies.

For example:

```text
Order Service
      |
      v
Payment Service
```

If Payment becomes unavailable or significantly slower, Order may also become slow or fail.

Traditional functional testing mainly asks:

> "Does the system work when everything is operating normally?"

Chaos engineering asks:

> "What happens when part of the system fails?"

The problem ChaosGuard addresses is the difficulty of safely experimenting with these failures, observing their propagation, measuring their impact, and understanding the resulting system behavior.

ChaosGuard provides a controlled environment where failures can be intentionally introduced and analyzed without affecting external production systems.

The platform should go beyond simply breaking a service. It should help users understand:

- What failed
- Why the failure occurred
- Which services were affected
- How far the failure propagated
- What measurable impact occurred
- Whether the system recovered
- Whether resilience improvements reduced the impact

---

## 3. Product Goal

The primary goal of ChaosGuard is to provide a controlled platform where users can:

1. View a microservice environment.
2. Understand service dependencies and topology.
3. Select a service to experiment on.
4. Select and configure a failure type.
5. Run a controlled chaos experiment.
6. Observe the resulting system behavior.
7. Identify affected and dependent services.
8. Measure the impact of the failure.
9. View experiment results and metrics.
10. Compare system behavior across experiments.
11. Test whether resilience improvements reduce failure impact.

The core idea is:

```text
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
```

The platform should therefore demonstrate not only that failures can be injected, but that controlled experiments can be used to evaluate system resilience.

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
- System observability

### Secondary Users

Engineering teams or learners who want a controlled environment for experimenting with service failures, understanding failure propagation, and evaluating resilience mechanisms.

ChaosGuard is primarily designed as a developer/engineering learning and experimentation platform rather than a general consumer product.

---

## 5. Core User Journey

The primary user journey is:

```text
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
Creates experiment
        |
        v
Starts experiment
        |
        v
System executes the controlled failure
        |
        v
Failure propagation is observed
        |
        v
System metrics are collected
        |
        v
Affected services are identified
        |
        v
Fault is removed
        |
        v
System recovery is observed
        |
        v
Experiment results are displayed
        |
        v
User analyzes the result
        |
        v
User can improve resilience
        |
        v
Experiment can be rerun
        |
        v
Results can be compared
```

The platform should make the complete experiment lifecycle understandable to the user.

---

## 6. Core Features

### 6.1 Microservice Topology

The platform should represent the controlled microservice environment and its dependencies.

The environment will gradually evolve from the initial two-service system into a more representative microservice topology.

Target topology:

```text
                 Auth
                  |
                  v
                Order
               /     \
              v       v
          Payment   Inventory
```

The initial implementation may contain only:

```text
Order
  |
  v
Payment
```

Additional services should be introduced incrementally rather than adding unnecessary complexity at the beginning.

The topology should allow the user to understand:

- Which services exist
- Which services depend on one another
- Where a failure originates
- Which services may be affected by that failure

---

### 6.2 Controlled Fault Injection

Users should be able to intentionally introduce controlled failures into supported services.

Initial fault types:

- Latency
- Errors
- Service failure/unavailability

Example:

```text
Normal:

Order → Payment → 100ms

Experiment:

Order → Payment → 3000ms
```

The system should control the experiment rather than allowing arbitrary uncontrolled failures.

Future fault types may include:

- Additional network failures
- Resource exhaustion
- Other controlled infrastructure-level failures

These should only be introduced after the core fault-injection system is stable.

---

### 6.3 Experiment Configuration

Users should be able to configure an experiment using parameters appropriate to the selected fault.

For example:

```text
Service:
Payment

Fault:
Latency

Value:
3000 ms

Duration:
30 seconds
```

The experiment should clearly communicate what will be changed before execution.

An experiment should have an explicit lifecycle such as:

```text
PENDING
   ↓
QUEUED
   ↓
RUNNING
   ↓
COMPLETED
```

with appropriate failure and abort states when required.

---

### 6.4 Experiment Execution

The platform should execute the requested experiment in the controlled environment.

Experiment execution should be separated from the API request path when experiments become long-running.

The architecture should support asynchronous experiment execution using a queue and worker system.

The API should be responsible for accepting and managing experiment requests, while the worker should perform the long-running experiment execution.

The experiment system should also ensure that injected faults are removed after the experiment finishes.

Experiment execution should prioritize:

- Controlled execution
- Predictable lifecycle
- Fault cleanup
- Failure handling
- Safe termination

---

### 6.5 Real-Time Experiment Updates

The platform should provide live updates while an experiment is running.

Examples:

- Experiment queued
- Experiment started
- Fault injected
- Service degraded
- Service failed
- Dependent service affected
- Metrics changing
- Fault removed
- Service recovering
- Experiment completed

The final platform should use real-time communication to update the dashboard.

---

### 6.6 Failure Propagation Visualization

The platform should visually communicate how a failure spreads through service dependencies.

Example:

```text
Payment 🔴
    |
    v
Order 🟡
    |
    v
Inventory 🟡
```

The visualization should make it easy to identify:

- The service where the fault originated
- Directly affected services
- Indirectly affected services
- Current service health
- Failure propagation direction
- Recovery state

The topology visualization should become an important part of understanding the experiment rather than simply being a decorative diagram.

---

### 6.7 Experiment Results

After an experiment, the platform should provide a report containing information such as:

- Experiment configuration
- Target service
- Fault type
- Fault parameters
- Experiment status
- Experiment duration
- Affected services
- Observed behavior
- Relevant metrics
- Failure propagation
- Recovery behavior
- Blast radius
- Experiment timeline

The result should allow the user to understand what happened during the experiment.

---

### 6.8 Metrics and Observability

ChaosGuard should measure the impact of controlled failures rather than only showing service status.

Relevant metrics may include:

- Request count
- Success rate
- Error rate
- Response latency
- p50 latency
- p95 latency
- p99 latency
- Timeout count
- Throughput
- Service recovery time

The exact metrics should be introduced incrementally according to the project's implementation phase.

The system should support comparison between:

```text
Normal / Baseline
        vs
During Chaos
        vs
After Recovery
```

This allows experiments to produce measurable results rather than only qualitative observations.

---

### 6.9 Controlled Load Testing

ChaosGuard should eventually support controlled traffic generation so that failures can be observed under measurable request load.

The purpose is to answer questions such as:

- How does latency change under fault conditions?
- How does error rate change?
- How many requests fail?
- How does a dependency failure affect throughput?
- How quickly does the system recover?

Load generation must be controlled and limited to the intended experimental environment.

Load testing should be introduced after the core experiment and service environment are stable.

---

### 6.10 Experiment History

The platform should maintain experiment history so users can review previous experiments.

An experiment history entry should contain information such as:

- Experiment ID
- Target service
- Fault type
- Duration
- Status
- Date/time
- Key metrics
- Affected services

Users should be able to open a previous experiment and view its detailed results.

---

### 6.11 Experiment Comparison

The platform should eventually allow users to compare experiments.

A major use case is:

```text
Before Resilience Improvement
            vs
After Resilience Improvement
```

For example:

```text
                Before       After

p95 latency     3000ms       800ms
error rate       35%          5%
timeouts         20           2
blast radius     2 services   1 service
```

The exact metrics will depend on what is implemented by the relevant phase.

The purpose of comparison is to determine whether a resilience improvement actually changed the system's behavior under the same or comparable failure condition.

---

### 6.12 Resilience Testing Loop

A central capability of ChaosGuard should be the ability to repeat controlled experiments after resilience improvements.

The intended workflow is:

```text
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
6. Run the same experiment again
        ↓
7. Measure impact again
        ↓
8. Compare results
```

Examples of resilience improvements that may eventually be tested include:

- Timeouts
- Retries
- Circuit breakers
- Fallbacks
- Dependency isolation
- Rate limiting

ChaosGuard should not automatically modify application code.

The user remains responsible for applying resilience improvements and then rerunning the experiment.

---

### 6.13 Optional AI-Assisted Analysis

AI may be introduced as an optional future capability.

If implemented, the AI layer may analyze actual experiment data and help explain:

- What happened
- Which services were affected
- Which dependencies were important
- Why the failure propagated
- What risks were revealed
- What resilience patterns may be relevant

AI analysis should be based primarily on observed experiment data rather than being the core mechanism used to execute experiments.

AI must not autonomously execute destructive experiments.

AI-assisted analysis is optional and should not be required for the core ChaosGuard experiment lifecycle.

---

## 7. Initial Microservice Environment

The controlled environment will begin with a minimal system:

```text
Order Service
      |
      v
Payment Service
```

The initial two-service system exists specifically to make the underlying service communication and failure propagation easy to understand before introducing additional complexity.

As the project evolves, the controlled environment should expand toward:

```text
                 Auth
                  |
                  v
                Order
               /     \
              v       v
          Payment   Inventory
```

Additional services should be introduced incrementally.

The initial target additional services are:

- Auth
- Inventory

Other services such as Notification may be considered later if they provide a meaningful experiment or dependency relationship.

The purpose of expanding the environment is to create more meaningful dependency graphs and demonstrate multi-service failure propagation.

---

## 8. Non-Functional Requirements

### Reliability

Experiments must be controlled and should not unintentionally affect systems outside the intended experimental environment.

Faults should be automatically removed when an experiment completes or is terminated.

### Observability

The system should provide enough information to understand what happened during an experiment.

This includes:

- Service state
- Experiment state
- Relevant metrics
- Failure propagation
- Recovery behavior

### Modularity

Services and major components should remain independently understandable and replaceable.

### Extensibility

The architecture should allow additional:

- Services
- Fault types
- Experiment configurations
- Metrics
- Resilience experiments
- Analysis capabilities

to be added without rewriting the entire application.

### Safety

Chaos experiments must be explicitly controlled.

Experiments should be limited to the intended controlled environment.

The system should provide mechanisms for:

- Experiment duration limits
- Fault cleanup
- Controlled termination
- Safe failure handling

The AI analysis system must not autonomously execute destructive experiments.

### Maintainability

The codebase should use clear boundaries and avoid unnecessary complexity or premature abstractions.

Future technologies should only be introduced when they solve an actual requirement of the current phase.

---

## 9. MVP Scope

The MVP should demonstrate the complete basic chaos-engineering concept:

1. A controlled microservice environment.
2. Service-to-service communication.
3. Controlled fault injection.
4. Experiment configuration.
5. Experiment execution.
6. Failure observation.
7. Failure propagation visualization.
8. Basic experiment results.
9. Basic system metrics.
10. Controlled fault cleanup.

The MVP should prioritize a coherent end-to-end experience over a large number of features.

Advanced capabilities such as:

- Multiple additional services
- Real-time dashboard updates
- Experiment history
- Experiment comparison
- Controlled load testing
- Resilience improvement comparison
- Optional AI-assisted analysis

should be introduced incrementally after the core system is stable.

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
- Generic RAG/vector-search infrastructure unrelated to experiment data

ChaosGuard should remain focused on controlled experimentation and analysis within its designed environment.

---

## 11. Future Scope

Potential future improvements include:

- Additional microservices
- Additional fault types
- Network-level failures
- Resource exhaustion experiments
- More advanced metrics
- Controlled load testing
- Experiment history
- Experiment comparison
- Resilience pattern experiments
- Advanced topology analysis
- Distributed tracing
- OpenTelemetry integration
- More sophisticated AI reasoning based on actual experiment data
- Cloud deployment
- Authentication and multi-user support

These features should only be introduced after the core system is stable and when they provide a clear benefit to the project's goals.

---

## 12. Success Criteria

ChaosGuard will be considered successful when a user can:

1. Open the platform and understand the service topology.
2. Select a service and configure a controlled fault.
3. Execute an experiment safely.
4. Observe the target service and dependent services changing state.
5. Understand how the failure propagated.
6. View measurable experiment results.
7. Observe system recovery after the fault is removed.
8. Review experiment history.
9. Compare experiments where applicable.
10. Apply a resilience improvement and rerun an experiment.
11. Determine whether system behavior changed under the tested failure condition.

The final system should demonstrate not only that an experiment can be executed, but also that the user can understand, measure, and evaluate the resulting system behavior.

The central value of ChaosGuard is:

> **Break the system in a controlled way → measure what happens → improve resilience → run the experiment again → compare the results.**