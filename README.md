# Contract Language Protocol (CLP)

[![npm version](https://img.shields.io/npm/v/@yav-ai/clp.svg)](https://www.npmjs.com/package/@yav-ai/clp)
[![Test Status](https://github.com/yav-ai/clp/actions/workflows/ci.yml/badge.svg)](https://github.com/yav-ai/clp/actions)
[![codecov](https://codecov.io/github/yav-ai/clp/branch/main/graph/badge.svg?token=B0IDE2W725)](https://codecov.io/github/yav-ai/clp)

The **Contract Language Protocol (CLP)** is an authority-first execution protocol for AI-assisted software systems.

CLP defines a deterministic boundary between **intelligence** (AI models, agents, reasoning systems) and **authority** (state changes, side effects, irreversible actions). Its purpose is to ensure that probabilistic systems can _assist_ software — without ever silently becoming decision-makers.

CLP is designed to be used **alongside existing AI frameworks** such as OpenAI SDKs or LangChain, not as a replacement.

---

## Quick Start

```bash
npm install @yav-ai/clp
```

```typescript
import { createContract, createRuntime } from "@yav-ai/clp";

// Define a contract
const counterContract = createContract({
  intents: {
    increment: {
      inputs: { amount: "number?" },
    },
  },
  state: { count: "number" },
  guards: [
    {
      name: "no_negative",
      deny: (ctx) =>
        ctx.intent.payload.amount != null && ctx.intent.payload.amount < 0,
    },
  ],
  transitions: {
    apply: {
      when: (ctx) => ctx.intent.complete,
      effects: (ctx) => ({
        count: (ctx.state.count ?? 0) + (ctx.intent.payload.amount ?? 1),
      }),
    },
  },
});

// Create runtime with optional AI provider
const aiProvider = async (intent) => ({ amount: 1 });
const runtime = createRuntime(counterContract, aiProvider);

// Use the runtime
runtime.dispatch("increment", { amount: 5 });
await runtime.propose("increment");
runtime.acceptProposal("increment");
runtime.commit("apply");

console.log(runtime.getState("count")); // 5
console.log(runtime.getLog()); // Full audit trail
```

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
- non-bypassable by AI or application code a complete audit log,
- observable through.

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

---

## Execution lifecycle

1. An intent is dispatched (complete or incomplete)
2. AI may optionally propose missing values
3. Proposals must be explicitly accepted
4. Guards are enforced
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

---

## Examples

| Example                                        | Description                     |
| ---------------------------------------------- | ------------------------------- |
| [`examples/counter/`](examples/counter/)       | Simple counter with AI proposal |
| [`examples/flight/`](examples/flight/)         | Flight booking with guards      |
| [`examples/reminder/`](examples/reminder/)     | Reminder with validation        |
| [`examples/classifier/`](examples/classifier/) | Classifier with category check  |

---

## API Reference

### `createContract(config)`

Creates a contract definition.

```typescript
const contract = createContract({
  intents: { ... },
  state: { ... },
  guards: [ ... ],
  transitions: { ... },
});
```

### `createRuntime(contract, aiProvider?)`

Creates a runtime instance.

```typescript
const runtime = createRuntime(contract, async (intent) => {
  // Return AI proposal
  return { amount: 5 };
});
```

### Runtime Methods

- `dispatch(intentName, payload)` - Dispatch an intent
- `propose(intentName)` - Request AI proposal
- `acceptProposal(intentName)` - Accept staged proposal
- `commit(transitionName?)` - Execute transition
- `getState(key)` - Get state value
- `subscribe(key, callback)` - Subscribe to state changes
- `getLog()` - Get audit log

---

## Documentation

- [ROADMAP](./ROADMAP.md) - Future plans and feature ideas
- [CONTRIBUTING](./CONTRIBUTING.md) - How to contribute
- [CODE_OF_CONDUCT](./CODE_OF_CONDUCT.md) - Community guidelines

---

## License

MIT License - see [LICENCE.md](./LICENCE.md)

---

&copy; 2026 YAV.AI PTY LTD
