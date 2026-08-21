ChaosGuard — Design System

1. Purpose

This document defines the visual and interaction direction for the ChaosGuard frontend.

The design should communicate:

- Reliability engineering
- Distributed systems
- Observability
- Controlled experimentation
- Technical depth
- AI-assisted analysis

The interface should feel like an engineering/observability platform rather than a generic SaaS dashboard.

The design system should remain consistent across the application.

---

2. Design Philosophy

ChaosGuard should have a:

- Modern
- Technical
- Clean
- Professional
- Developer-focused
- Data-oriented

visual identity.

The interface should prioritize information clarity over decoration.

The most important information should always be easy to identify:

1. Current system health
2. Running experiment
3. Target service
4. Fault being injected
5. Affected services
6. Experiment result
7. AI analysis
8. Resilience recommendations

The UI should make complex distributed-system behavior easier to understand visually.

---

3. Visual Direction

The visual direction should combine:

Observability Dashboard
        +
Developer Tool
        +
Chaos Engineering Platform
        +
Modern AI Product

Avoid making the interface look like:

- A generic admin panel
- A generic e-commerce dashboard
- A simple CRUD application
- A flashy marketing website
- An overly animated AI chatbot

The product should look like a serious engineering tool.

---

4. Color Philosophy

Colors should communicate system state and severity.

The primary interface should use a restrained neutral foundation with a distinctive technical accent.

Avoid using too many bright colors simultaneously.

---

5. System Status Colors

The following semantic states should remain consistent throughout the application.

Healthy

Represents:

- Service operating normally
- Experiment completed successfully
- Healthy dependency

State: HEALTHY

Use the standard success/healthy visual treatment.

---

Degraded

Represents:

- Increased latency
- Partial failure
- Performance degradation
- Dependency impact

State: DEGRADED

Use the standard warning visual treatment.

---

Failed

Represents:

- Service unavailable
- Experiment-induced failure
- Critical dependency failure

State: FAILED

Use the standard error/critical visual treatment.

---

Running

Represents:

- Experiment currently executing
- Service currently being tested
- Active experiment state

State: RUNNING

Use the standard active/in-progress visual treatment.

---

Unknown

Represents:

- Unknown service state
- Missing telemetry
- Unable to determine current state

State: UNKNOWN

Use a neutral visual treatment.

---

6. Semantic Color Principle

Colors must communicate meaning rather than decoration.

For example:

Green → Healthy
Yellow/Amber → Degraded or Warning
Red → Failed/Critical
Blue/Accent → Active/Interactive
Neutral → Unknown/Inactive

The exact color values may be finalized during frontend implementation.

Components should use semantic design tokens rather than hardcoding arbitrary colors throughout the codebase.

---

7. Typography

Typography should prioritize readability.

Use a modern sans-serif font family suitable for developer-facing interfaces.

The typography hierarchy should clearly distinguish:

Page Title

Used for major screens.

Section Heading

Used for major dashboard sections.

Card Heading

Used for individual components.

Body Text

Used for descriptions and explanations.

Metadata

Used for:

- timestamps
- service names
- experiment IDs
- status information
- technical details

Code / Technical Data

Use a monospace font for:

- API paths
- IDs
- logs
- code
- technical values

---

8. Recommended Typography Direction

Primary UI font:

Inter

Fallback:

system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

Monospace:

JetBrains Mono

or an equivalent developer-oriented monospace font.

The implementation should use a consistent typography scale rather than arbitrary font sizes.

---

9. Layout Principles

The interface should use a structured dashboard layout.

Major areas may include:

┌───────────────────────────────────────────────┐
│ Navigation / Header                           │
├───────────────────────────────────────────────┤
│                                               │
│ Main Content                                  │
│                                               │
│  System Overview                              │
│                                               │
│  Experiment / Topology / Results              │
│                                               │
└───────────────────────────────────────────────┘

The exact layout can evolve as features are implemented.

Do not force the final layout before the actual feature requirements are known.

---

10. Dashboard Information Hierarchy

The dashboard should prioritize:

System Health
      ↓
Active Experiment
      ↓
Topology
      ↓
Affected Services
      ↓
Experiment Results
      ↓
AI Analysis
      ↓
Recommendations

Critical information should be visible without requiring the user to search through multiple screens.

---

11. Service Representation

Each service should have a clear visual identity.

A service representation may include:

┌─────────────────────────┐
│ Payment Service         │
│                         │
│ ● HEALTHY               │
│                         │
│ Port: 3002              │
└─────────────────────────┘

Potential information:

- Service name
- Current state
- Dependencies
- Port/environment information where useful
- Current experiment
- Relevant metrics

Do not overload service cards with unnecessary information.

---

12. Topology Visualization

The topology is one of the most important visual components of ChaosGuard.

Example:

              Auth 🟢
                 |
                 v
             Order 🟡
              /    \
             /      \
            v        v
       Payment 🔴  Inventory 🟢

The topology should communicate:

- Direction of dependencies
- Target service
- Healthy services
- Degraded services
- Failed services
- Failure propagation

The graph should make the relationship between services visually obvious.

---

13. Experiment State Visualization

Experiments should have a clear lifecycle.

Configured
    ↓
Queued
    ↓
Running
    ↓
Fault Injected
    ↓
Observing
    ↓
Completed

Possible final states:

Completed
Failed
Cancelled

Each state should have a consistent visual representation.

---

14. Experiment Configuration UI

The experiment configuration interface should make the experiment explicit before execution.

Example:

Target Service
[ Payment Service ]

Fault Type
[ Latency ]

Duration
[ 30 seconds ]

Latency
[ 3000 ms ]

             [ Run Experiment ]

The user should clearly understand:

- What service will be affected
- What fault will be injected
- What parameters will be used
- What action will happen after clicking the button

---

15. Experiment Execution UX

When an experiment is running, the interface should communicate progress.

Example:

EXPERIMENT RUNNING

Payment Service
      ↓
Latency Injection: 3000 ms

Status:
● Fault Injected

Affected:
Payment
Order

Elapsed:
12s

The user should not be left wondering whether the experiment is still running.

---

16. Experiment Results

The result view should clearly separate observed facts from interpretation.

Example:

EXPERIMENT RESULT

Target:
Payment Service

Fault:
3 second latency

Result:
SYSTEM DEGRADED

Affected Services:
Payment
Order

Observed:
Order response latency increased.

Then separately:

AI ANALYSIS

Risk:
HIGH

Explanation:
Payment is a critical dependency of Order.

Recommendations:
- Add timeout handling
- Consider circuit breaker protection
- Test complete Payment failure

This distinction is important.

Observed system behavior should not be visually confused with AI-generated interpretation.

---

17. AI Analysis UI

AI-generated information should feel integrated into the engineering workflow rather than appearing as a generic chatbot.

The AI section should communicate:

What happened

A concise explanation of observed behavior.

Why it happened

A dependency/failure explanation.

Risk

A clear severity assessment.

Recommendations

Actionable resilience improvements.

Supporting Knowledge

When RAG is implemented, relevant retrieved knowledge may be shown or referenced.

---

18. Risk Visualization

Risk should be immediately understandable.

Possible levels:

LOW
MEDIUM
HIGH
CRITICAL

Risk should be represented using:

- Text
- Semantic color
- Optional icon

Do not rely only on color to communicate risk.

---

19. Cards

Cards should be used to group related information.

Examples:

- Service health
- Experiment configuration
- Experiment result
- AI analysis
- Metrics
- Recommendations

Cards should have:

- Clear hierarchy
- Consistent padding
- Moderate border radius
- Subtle separation from the background

Avoid excessive card nesting.

---

20. Buttons

Buttons should clearly communicate action type.

Primary action:

Run Experiment

Secondary actions:

View Results
Cancel
Reset

Destructive actions should require additional clarity or confirmation when appropriate.

For example:

Stop Experiment

should clearly communicate what will happen.

---

21. Forms

Forms should:

- Clearly label inputs
- Show valid input expectations
- Provide useful validation errors
- Avoid unnecessary fields
- Clearly distinguish required fields
- Prevent invalid experiment configurations

Experiment configuration should prioritize safety and clarity.

---

22. Loading States

Every asynchronous operation should have a visible loading state where appropriate.

Examples:

Loading topology...
Running experiment...
Fetching results...
Analyzing experiment...
Retrieving knowledge...

Avoid leaving blank areas while data is being loaded.

---

23. Error States

Errors should explain:

1. What went wrong.
2. What the user can do next.

Example:

Payment Service is unavailable.

The experiment could not be completed.

[Retry]

Avoid generic messages such as:

Something went wrong.

when a more useful explanation is possible.

---

24. Empty States

Empty states should explain what the user can do next.

Example:

No experiments yet.

Run your first controlled experiment
to observe failure propagation.

[Create Experiment]

---

25. Motion and Animation

Animations should be purposeful.

Useful animations may include:

- Service state transitions
- Experiment progress
- Topology state changes
- Loading indicators
- Event propagation

Avoid excessive animation.

The product is an engineering tool, so motion should communicate system behavior rather than distract from it.

---

26. Accessibility

The UI should not rely only on color.

For example:

🟢 HEALTHY
🟡 DEGRADED
🔴 FAILED

should include text/state information in addition to color.

Interactive elements should have:

- Clear labels
- Visible focus states
- Sufficient contrast
- Understandable error messages

---

27. Responsive Design

The application should work across:

- Desktop
- Laptop
- Tablet

The topology visualization should receive special consideration because graph-based layouts require sufficient screen space.

The desktop experience should be the primary optimization target because ChaosGuard is a developer/engineering tool.

---

28. Design Tokens

The frontend should eventually define reusable design tokens for:

- Colors
- Typography
- Spacing
- Border radius
- Shadows
- Status states
- Component sizes

Components should consume these tokens rather than repeatedly defining arbitrary values.

---

29. Design Evolution

The design system may evolve as new functionality is introduced.

However, visual changes should remain consistent with the overall product identity:

Technical
+
Professional
+
Observable
+
Experiment-focused
+
AI-assisted

Do not redesign the entire interface when adding a new feature.

Extend the existing design system.

---

30. Design Principle

The most important design rule is:

«Make complex distributed-system behavior understandable at a glance.»

A user should be able to quickly answer:

What is healthy?
What is failing?
What experiment is running?
What service was targeted?
What services were affected?
What happened?
Why did it happen?
What should I improve?

The UI exists to make these answers obvious.