# Contract Language Protocol (CLP)

The **Contract Language Protocol (CLP)** is an authority-first execution protocol for AI-assisted software systems.

CLP defines a deterministic boundary between **intelligence** (AI models, agents, reasoning systems) and **authority** (state changes, side effects, irreversible actions). Its purpose is to ensure that probabilistic systems can _assist_ software — without ever silently becoming decision-makers.

CLP is designed to be used **alongside existing AI frameworks** such as OpenAI SDKs or LangChain, not as a replacement.

---

## Why CLP exists

Modern AI systems are powerful, but they are inherently:

- non-deterministic
- non-auditable by default
- prone to silent behavioural drift
- incapable of enforcing hard guarantees

In production systems, these properties become dangerous when AI output influences:

- user data
- permissions and access control
- financial transactions
- infrastructure changes
- irreversible actions

CLP exists to close this gap.

It ensures that **no AI output may cause a state change unless it passes an explicit, deterministic contract check enforced in code**.

---

## Core invariant

> **AI may propose values, but it may never directly cause a state change.**

This invariant is:

- enforced by the runtime (not prompts or policies),
- non-bypassable by AI or application code,
- observable through a complete audit log.

If this invariant is violated, the system is considered incorrect.

---

## What CLP is (and is not)

### CLP is

- a **contract language protocol**
- a **runtime authority layer**
- a **deterministic execution boundary**
- a foundation for auditable AI-assisted systems
- framework-agnostic by design

### CLP is not

- a prompt framework
- an AI orchestration engine
- a workflow DSL
- a UI framework
- a replacement for business logic
- a competitor to LangChain or OpenAI SDKs

CLP does not make decisions.  
It verifies whether decisions are allowed to execute.

---

## Design principles

- **authority before intelligence**  
  AI is always treated as untrusted input until explicitly accepted.

- **contracts over conventions**  
  Rules live in executable code, not in prompts or documentation.

- **determinism at the edges**  
  All state changes are explainable, replayable, and auditable.

- **boring by design**  
  Cleverness is avoided where it could weaken guarantees.

---

## Architectural model

CLP models execution using explicit, minimal primitives.

### Intents

Describe _what is being attempted_.

### State

The authoritative application state. Opaque to AI.

### Transitions

The only place where state may change.

### Guards

Hard, non-negotiable prohibitions.

### AI proposals

Optional, untrusted suggestions.

### Evaluations

Deterministic checks that may block execution.

---

## Execution lifecycle

1. An intent is dispatched (complete or incomplete)
2. AI may optionally propose missing values
3. Proposals must be explicitly accepted
4. Guards and evaluations are enforced
5. A transition applies state changes atomically
6. All steps are logged

---

## Usage model

CLP supports multiple usage patterns:

- **Standalone** — CLP governs execution directly
- **With OpenAI** — AI generates proposals only
- **With LangChain** — LangChain reasons, CLP enforces authority

CLP never depends on any AI framework.  
Integrations are optional and additive.
