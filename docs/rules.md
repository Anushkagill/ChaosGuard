ChaosGuard — Development Rules

1. Purpose

This document defines the rules that must be followed when developing ChaosGuard.

These rules apply to:

- AI coding agents
- Human developers
- Automated tools
- Future contributors

The goal is to keep the project understandable, maintainable, incremental, and technically coherent.

---

2. Core Development Principle

ChaosGuard must be built incrementally.

The project must never be developed by generating the entire application at once.

The current phase is the source of truth for what should be implemented.

If a feature belongs to a future phase:

- Do not implement it early.
- Do not install its dependencies early.
- Do not create unnecessary placeholder architecture for it.
- Do not modify the current system just to prepare for it unless explicitly required.

---

3. AI Coding Agent Rules

AI coding agents such as Antigravity must behave as implementation agents, not autonomous architects.

Before making significant changes, the agent should:

1. Read "docs/prd.md".
2. Read "docs/architecture.md".
3. Read "docs/rules.md".
4. Read "docs/phases.md".
5. Read "docs/memory.md" when it exists.
6. Inspect the existing code.
7. Identify the current phase.
8. Implement only the requested task.

The agent must not assume that a technology mentioned in the final architecture is already implemented.

---

4. No Unrequested Features

Do not add functionality that was not requested for the current phase.

Examples of premature features:

- Authentication
- Databases
- Redis
- BullMQ
- Socket.io
- AI APIs
- RAG
- Vector search
- Docker
- Cloud deployment

unless the current phase explicitly requires them.

If the agent believes a future feature is necessary, it should stop and explain why rather than silently implementing it.

---

5. Preserve Working Functionality

Existing working behavior must not be broken unnecessarily.

Before changing existing code:

- Understand what the code currently does.
- Identify dependencies.
- Preserve existing API contracts unless a change is explicitly requested.
- Run the existing tests or verification commands.
- Verify the system again after the change.

A refactor should not silently become a redesign.

---

6. Small Changes

Prefer small, understandable changes over large rewrites.

A change should ideally have one clear purpose.

Bad approach:

Refactor the entire backend
+ add Docker
+ add Redis
+ add authentication
+ change API structure
+ add database

Good approach:

Refactor current Order Service routes

Then test.

Then move to the next task.

---

7. Explain Before Major Architectural Changes

For normal implementation work, the AI agent may proceed without long explanations.

However, before making a significant architectural change, the agent should state:

1. What is changing?
2. Why is it needed?
3. Which existing components are affected?
4. Which phase requires it?

The agent should not make major architectural decisions silently.

---

8. Dependency Rules

Do not install a library simply because it is popular.

Before adding a dependency, determine:

1. What problem does it solve?
2. Can the existing stack solve the problem?
3. Is the dependency appropriate for the current phase?
4. Will it create unnecessary complexity?

Every external dependency should have a clear reason.

Avoid dependency duplication.

For example, do not add multiple libraries that solve the same problem unless there is a documented reason.

---

9. Technology Rules

Use the technologies defined in "architecture.md" when their corresponding phase is reached.

Do not replace a technology with another one without an explicit architectural decision.

For example:

- Node.js remains the backend runtime unless explicitly changed.
- Express remains the initial HTTP framework.
- Axios may be used for service-to-service HTTP communication where appropriate.
- Redis is introduced only when asynchronous infrastructure is required.
- BullMQ is introduced only when experiment jobs require a queue.
- React is introduced when the frontend phase begins.
- React Flow is introduced when topology visualization begins.
- MongoDB is introduced when persistence is required.
- RAG and vector search are introduced only during the AI knowledge phase.

---

10. No Premature Abstraction

Do not create abstractions simply because they might be useful someday.

Build the simplest implementation that satisfies the current requirement.

Introduce abstractions when:

- The same logic is genuinely repeated.
- The current code has become difficult to maintain.
- A future feature actually requires the abstraction.
- The abstraction makes the architecture clearer rather than more complicated.

Avoid creating empty or speculative:

- Utility layers
- Generic managers
- Factory systems
- Service frameworks
- Repository layers
- Configuration frameworks

without a concrete need.

---

11. API Rules

APIs must have:

- Clear endpoint names
- Appropriate HTTP methods
- Predictable request formats
- Predictable response formats
- Appropriate HTTP status codes
- Basic input validation
- Clear error responses

Example:

POST /orders

should have a clearly defined request and response structure.

Do not silently change an existing API contract.

If an API contract needs to change, document the change.

---

12. Service Boundary Rules

Each microservice should have a clearly defined responsibility.

For example:

Order Service
→ order-related behavior

Payment Service
→ payment-related behavior

Do not put unrelated business logic into another service simply because it is convenient.

Services should communicate through explicit APIs rather than directly accessing another service's internal code or data.

---

13. Error Handling Rules

Errors must be handled deliberately.

The system should distinguish between:

Client errors

Examples:

- Invalid input
- Missing required fields
- Invalid experiment configuration

Usually represented by appropriate 4xx responses.

Service errors

Examples:

- Internal processing failure
- Unexpected application error

Usually represented by appropriate 5xx responses.

Dependency errors

Examples:

- Payment Service unavailable
- Worker unavailable
- Database unavailable

These should be detected and represented clearly.

Do not silently swallow errors.

Do not use empty "catch" blocks.

---

14. Error Messages

Error messages should be:

- Clear
- Useful for debugging
- Safe to expose to users

Internal implementation details should not unnecessarily be exposed in production responses.

Detailed errors may be logged internally during development.

---

15. Logging Rules

Logs should help understand system behavior.

Useful logs include:

- Service startup
- Experiment start
- Experiment completion
- Fault injection
- Service failure
- Important dependency failures
- Unexpected errors

Avoid excessive logging of every trivial operation.

Logs should not expose:

- Passwords
- Secrets
- API keys
- Authentication tokens
- Sensitive user information

---

16. Environment Configuration

Environment-specific values should not be hardcoded when they need to change between environments.

Examples:

PORT
PAYMENT_SERVICE_URL
DATABASE_URL
REDIS_URL
LLM_API_KEY

Use environment variables where appropriate.

Never commit real secrets to Git.

Provide ".env.example" when environment variables become necessary.

---

17. Security Rules

Never commit:

- API keys
- Passwords
- Access tokens
- Private credentials
- Production secrets

Secrets must be provided through environment configuration.

Do not expose internal infrastructure unnecessarily.

ChaosGuard should assume that experiment execution is potentially dangerous and must remain controlled.

---

18. Chaos Experiment Safety Rules

Chaos experiments must be explicitly controlled.

Every experiment should eventually identify:

- Target service
- Fault type
- Fault parameters
- Experiment duration
- Experiment status

The system should have clear boundaries around what can be modified.

ChaosGuard should initially operate only on its own controlled environment.

It must not execute arbitrary destructive commands against external infrastructure.

---

19. AI Safety and Responsibility

The AI layer is an analysis and recommendation component.

It must not be treated as the source of ground truth about the experiment.

Ground truth should come from:

- Experiment configuration
- Service state
- Observed events
- Metrics
- Experiment results

The AI uses these observations to produce explanations and recommendations.

---

20. AI Must Not Autonomously Execute Chaos

The AI may:

- Analyze experiment results
- Explain failures
- Identify possible risks
- Recommend resilience patterns
- Suggest future experiments

The AI must not independently execute destructive experiments.

The intended flow is:

User
 |
 | Explicit experiment configuration
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
AI Analysis
 |
 v
Recommendations

Not:

AI
 |
 | autonomous decision
 v
Infrastructure

---

21. RAG Rules

When RAG is introduced:

The retrieval system should provide relevant engineering knowledge to the LLM.

RAG should not fabricate experiment results.

The system should clearly distinguish:

- Observed facts
- Retrieved knowledge
- AI-generated interpretation
- AI recommendations

The AI should not claim that a recommendation was observed during the experiment if it was only generated as a recommendation.

---

22. AI Recommendation Rules

AI recommendations should be connected to observed system behavior.

For example:

Observed:

Payment latency caused Order timeout.

Reasonable recommendation:

Consider downstream timeout handling and circuit breaker protection.

Unrelated recommendations should not be generated merely to make the response longer.

Recommendations should explain why they apply.

---

23. Testing Rules

Every meaningful implementation change should be tested.

Testing may include:

- Unit tests
- API tests
- Integration tests
- Manual verification
- Service health checks
- Failure scenario testing

For distributed-system changes, test both:

Normal flow

and:

Failure flow

Example:

Payment available
→ Order succeeds

Payment unavailable
→ Order handles dependency failure

---

24. Current Phase Verification

At the end of each phase, verify the phase's acceptance criteria.

Do not move to the next phase merely because the code compiles.

A phase is complete only when:

- Required functionality exists.
- Expected behavior works.
- Failure cases are handled where required.
- The implementation matches the architecture.
- The acceptance criteria are satisfied.
- Documentation is updated.

---

25. Documentation Rules

Documentation must describe the actual system, not an imagined future system.

When a component is planned but not implemented, clearly label it as:

Planned

or:

Future

Do not document future architecture as if it already exists.

When implementation changes the architecture:

1. Update the relevant documentation.
2. Record the decision in "memory.md".
3. Explain why the architecture changed.

---

26. Memory Rules

When "docs/memory.md" exists, update it after meaningful development milestones.

It should record:

- Current phase
- Current task
- Completed work
- Current architecture
- Important decisions
- Files created/modified
- Known issues
- Tests performed
- Next task
- Last updated date

The memory file should describe what actually happened.

Do not use it as a second PRD or architecture document.

---

27. Git Rules

Make meaningful commits after stable milestones.

Commit messages should describe the change.

Examples:

feat: add order and payment services
refactor: separate order routes and controller
feat: add payment fault injection
feat: add experiment queue

Do not commit:

- "node_modules"
- ".env"
- secrets
- generated build artifacts unless required
- temporary debugging files

---

28. Code Quality Rules

Prefer:

- Clear variable names
- Small functions
- Single responsibility
- Explicit control flow
- Simple architecture
- Consistent formatting
- Meaningful error handling

Avoid:

- Unnecessary cleverness
- Deeply nested logic
- Giant functions
- Duplicate code when reuse is genuinely justified
- Unused dependencies
- Unused files
- Dead code

Code should be understandable to a developer learning the system.

---

29. Learning-Oriented Development Rule

ChaosGuard is also a learning project.

Whenever a new major technology is introduced, its purpose should be understandable.

For every major technology, the developer should be able to answer:

1. What problem does it solve?
2. Why does ChaosGuard need it?
3. Why are we introducing it now?
4. What would happen if we did not use it?
5. How does it interact with the existing architecture?

The implementation should not hide these concepts behind unnecessary abstractions.

---

30. Stop Conditions for AI Agents

The AI coding agent must stop and ask for clarification when:

- Requirements conflict.
- A major architectural decision is unclear.
- A requested change would break an existing contract.
- A new dependency is necessary but not justified.
- The current phase does not provide enough information.
- A potentially destructive operation is requested without explicit scope.
- The agent discovers that the architecture document and actual implementation disagree significantly.

Do not guess silently in these situations.

---

31. Final Rule

The most important rule is:

«Build only what is needed, understand why it is needed, verify that it works, document what actually happened, and only then move to the next phase.»

ChaosGuard should remain a coherent engineering project rather than a collection of technologies added for the sake of the resume.