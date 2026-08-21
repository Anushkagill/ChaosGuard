# ChaosGuard

> An AI-assisted chaos engineering platform for experimenting with microservice failures, observing failure propagation, and generating resilience recommendations.

---

## Overview

ChaosGuard is a controlled chaos engineering platform built around a simulated microservice environment.

It allows a user to intentionally introduce controlled failures into services, observe how those failures propagate through service dependencies, analyze the resulting behavior, and receive AI-assisted resilience recommendations.

The project combines:

- Microservices
- Distributed systems
- Chaos engineering
- Fault injection
- Asynchronous job processing
- Real-time communication
- Observability
- Vector search
- Retrieval-Augmented Generation (RAG)
- AI-assisted analysis

The project is being developed incrementally so that every major technology has a clear purpose and can be understood independently.

---

## Problem

Modern applications are often composed of multiple interconnected services.

A failure in one service can affect dependent services.

For example:

```text
Order Service
      |
      v
Payment Service
