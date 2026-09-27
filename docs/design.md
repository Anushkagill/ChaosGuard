ChaosGuard — Design System

Purpose

This document defines the visual and interaction direction for the ChaosGuard frontend.

The design should communicate:

Reliability engineering

Distributed systems

Observability

Controlled experimentation

Technical depth

Resilience analysis

The interface should feel like an engineering/observability platform rather than a generic SaaS dashboard.

The design system should remain consistent across the application.

Design Philosophy

ChaosGuard should have a:

Modern

Technical

Clean

Professional

Developer-focused

Data-oriented

visual identity.

The interface should prioritize information clarity over decoration.

The most important information should always be easy to identify:

Current system health

Running experiment

Target service

Fault being injected

Affected services

Experiment result

Experiment and resilience analysis

Resilience recommendations

The UI should make complex distributed-system behavior easier to understand visually.

Visual Direction

The visual direction should combine:

Observability Dashboard
+
Developer Tool
+
Chaos Engineering Platform
+
Reliability Engineering Tool

Avoid making the interface look like:

A generic admin panel

A generic e-commerce dashboard

A simple CRUD application

A flashy marketing website

An overly animated AI chatbot

The product should look like a serious engineering tool.

Color Philosophy

Colors should communicate system state and severity.

The primary interface should use a restrained neutral foundation with a distinctive technical accent.

Avoid using too many bright colors simultaneously.

System Status Colors

The following semantic states should remain consistent throughout the application.

Healthy

Represents:

Service operating normally

Experiment completed successfully

Healthy dependency

State: HEALTHY

Use the standard success/healthy visual treatment.

Degraded

Represents:

Increased latency

Partial failure

Performance degradation

Dependency impact

State: DEGRADED

Use the standard warning visual treatment.

Failed

Represents:

Service unavailable

Experiment-induced failure

Critical dependency failure

State: FAILED

Use the standard error/critical visual treatment.

Running

Represents:

Experiment currently executing

Service currently being tested

Active experiment state

State: RUNNING

Use the standard active/in-progress visual treatment.

Unknown

Represents:

Unknown service state

Missing telemetry

Unable to determine current state

State: UNKNOWN

Use a neutral visual treatment.

Semantic Color Principle

Colors must communicate meaning rather than decoration.

For example:

Green → Healthy
Yellow/Amber → Degraded or Warning
Red → Failed/Critical
Blue/Accent → Active/Interactive
Neutral → Unknown/Inactive

The exact color values may be finalized during frontend implementation.

Components should use semantic design tokens rather than hardcoding arbitrary colors throughout the codebase.

Typography

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

timestamps

service names

experiment IDs

status information

technical details

Code / Technical Data

Use a monospace font for:

API paths

IDs

logs

code

technical values

Recommended Typography Direction

Primary UI font:

Inter

Fallback:

system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

Monospace:

JetBrains Mono

or an equivalent developer-oriented monospace font.

The implementation should use a consistent typography scale rather than arbitrary font sizes.

Layout Principles

The interface should use a structured dashboard layout.

Major areas may include:

┌───────────────────────────────────────────────┐
│ Navigation / Header │
├───────────────────────────────────────────────┤
│ │
│ Main Content │
│ │
│ System Overview │
│ │
│ Experiment / Topology / Results │
│ │
└───────────────────────────────────────────────┘

The exact layout can evolve as features are implemented.

Do not force the final layout before the actual feature requirements are known.

Dashboard Information Hierarchy

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
Observed Results
↓
Resilience Analysis
↓
Recommendations

Critical information should be visible without requiring the user to search through multiple screens.

Service Representation

Each service should have a clear visual identity.

A service representation may include:

┌─────────────────────────┐
│ Payment Service │
│ │
│ ● HEALTHY │
│ │
│ Port: 3002 │
└─────────────────────────┘

Potential information:

Service name

Current state

Dependencies

Port/environment information where useful

Current experiment

Relevant metrics

Do not overload service cards with unnecessary information.

Topology Visualization

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

Direction of dependencies

Target service

Healthy services

Degraded services

Failed services

Failure propagation

The graph should make the relationship between services visually obvious.

Experiment State Visualization

Experiments should have a clear lifecycle.

Configured
↓
PENDING
↓
QUEUED
↓
RUNNING
↓
Observing
↓
COMPLETED

Possible final states:

COMPLETED
FAILED
CANCELLED

The UI may communicate internal execution milestones such as fault activation,
observation, cleanup, and recovery, but the primary experiment state should remain
clear and consistent with the backend lifecycle.

Each state should have a consistent visual representation.

Experiment Configuration UI

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

What service will be affected

What fault will be injected

What parameters will be used

That clicking the button creates a PENDING experiment

That execution starts separately through the Start Experiment action

Experiment Execution UX

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

Experiment Results

The result view should clearly separate baseline observations, during-experiment observations, recovery observations, measured metrics, and interpretation.

A useful result structure is:

BEFORE

Baseline health

Baseline latency/error rate

DURING

Injected fault

Service state changes

Error/latency impact

Failure propagation

AFTER

Fault removed

Recovery state

Remaining degradation

COMPARISON

Baseline vs experiment

Recovery behavior

Resilience indicators

Interpretation should remain visually separate from measured system behavior.

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

RESILIENCE ANALYSIS

Risk:
HIGH

Explanation:
Payment is a critical dependency of Order.

Recommendations:

Add timeout handling

Consider circuit breaker protection

Test complete Payment failure

This distinction is important.

Observed system behavior should not be visually confused with analysis/interpretation.

Resilience Analysis UI

Analysis should feel integrated into the engineering workflow rather than appearing as a generic chatbot. If AI-assisted analysis is introduced later, it should be presented as an analysis layer over observed experiment data.

The analysis section should communicate:

What happened

A concise explanation of observed behavior.

Why it happened

A dependency/failure explanation.

Risk

A clear severity assessment.

Recommendations

Actionable resilience improvements.

Supporting Evidence

When analysis is available, supporting experiment data, metrics, timelines, and previous experiment results may be shown or referenced. Generic knowledge retrieval is not part of the core interface.

Risk Visualization

Risk should be immediately understandable.

Possible levels:

LOW
MEDIUM
HIGH
CRITICAL

Risk should be represented using:

Text

Semantic color

Optional icon

Do not rely only on color to communicate risk.

18.5 Resilience Comparison

ChaosGuard is intended to support a repeatable resilience-testing loop.

The UI should make it possible to compare:

Baseline
↓
Chaos Experiment
↓
Resilience Improvement
↓
Same Experiment Again
↓
Comparison

Useful comparison values may include:

Response latency

p95 latency when available

Error rate

Timeout rate

Recovery time

Affected services

Failure propagation

Experiment duration

The comparison view should show measured differences rather than assigning a
single overall score unless a future product requirement explicitly defines one.

Cards

Cards should be used to group related information.

Examples:

Service health

Experiment configuration

Experiment result

Resilience analysis

Metrics

Recommendations

Cards should have:

Clear hierarchy

Consistent padding

Moderate border radius

Subtle separation from the background

Avoid excessive card nesting.

Buttons

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

Forms

Forms should:

Clearly label inputs

Show valid input expectations

Provide useful validation errors

Avoid unnecessary fields

Clearly distinguish required fields

Prevent invalid experiment configurations

Experiment configuration should prioritize safety and clarity.

Loading States

Every asynchronous operation should have a visible loading state where appropriate.

Examples:

Loading topology...
Running experiment...
Fetching results...
Analyzing experiment...
Loading experiment data...

Avoid leaving blank areas while data is being loaded.

Error States

Errors should explain:

What went wrong.

What the user can do next.

Example:

Payment Service is unavailable.

The experiment could not be completed.

[Retry]

Avoid generic messages such as:

Something went wrong.

when a more useful explanation is possible.

Empty States

Empty states should explain what the user can do next.

Example:

No experiments yet.

Run your first controlled experiment
to observe failure propagation.

[Create Experiment]

Motion and Animation

Animations should be purposeful.

Useful animations may include:

Service state transitions

Experiment progress

Topology state changes

Loading indicators

Event propagation

Avoid excessive animation.

The product is an engineering tool, so motion should communicate system behavior rather than distract from it.

Accessibility

The UI should not rely only on color.

For example:

🟢 HEALTHY
🟡 DEGRADED
🔴 FAILED

should include text/state information in addition to color.

Interactive elements should have:

Clear labels

Visible focus states

Sufficient contrast

Understandable error messages

Responsive Design

The application should work across:

Desktop

Laptop

Tablet

The topology visualization should receive special consideration because graph-based layouts require sufficient screen space.

The desktop experience should be the primary optimization target because ChaosGuard is a developer/engineering tool.

Design Tokens

The frontend should eventually define reusable design tokens for:

Colors

Typography

Spacing

Border radius

Shadows

Status states

Component sizes

Components should consume these tokens rather than repeatedly defining arbitrary values.

Design Evolution

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
Resilience-focused

Do not redesign the entire interface when adding a new feature.

Extend the existing design system.

Design Principle

The most important design rule is:

«Make complex distributed-system behavior understandable at a glance.»

A user should be able to quickly answer:

What is healthy?
What is failing?
What experiment is running?
What service was targeted?
What services were affected?
What happened?
What evidence explains the impact?
Why did it happen?
What should I improve?

The UI exists to make these answers obvious.

Product Alignment

The design system should reflect the current ChaosGuard product direction.

Core product concepts:

Controlled chaos experiments

Microservice health

Failure propagation

Observability

Metrics

Experiment history

Resilience testing

Before/after comparison

The interface should not make AI the primary product identity.

AI-assisted analysis is an optional future layer that can explain observed
experiment behavior and suggest resilience improvements. The core UI must remain
useful without AI.

RAG and vector-search interfaces are not part of the current core design.

The visual hierarchy should therefore emphasize:

System Health
→ Experiment
→ Fault
→ Topology
→ Impact
→ Metrics
→ Recovery
→ Comparison
→ Resilience Improvements

This keeps the design aligned with ChaosGuard's central loop:

Break → Observe → Measure → Improve → Rerun → Compare