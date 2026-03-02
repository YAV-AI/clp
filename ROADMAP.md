# CLP Runtime Roadmap

> Vision: Making CLP production-ready for enterprise AI-assisted systems

---

## Current Limitations

The CLP runtime (v0.1) has these known limitations:

1. **In-memory state only** - No persistence across restarts
2. **Shallow state merge** - Only top-level state keys are supported
3. **No middleware/hooks** - Hard to integrate with external systems
4. **Synchronous transitions** - No support for async side effects
5. **No runtime validation** - TypeScript types are compile-time only

---

## Proposed Improvements

### 1. State Persistence (High Priority)

**Problem:** State is lost on process restart

**Solution:** Add storage adapters

```typescript
interface StorageAdapter {
  load(key: string): Promise<State | null>;
  save(key: string, state: State): Promise<void>;
  delete(key: string): Promise<void>;
}

// Built-in adapters to provide:
- LocalStorageAdapter (browser)
- MemoryAdapter (default, current behavior)
- RedisAdapter (distributed systems)
- FileSystemAdapter (Node.js)
- DatabaseAdapter (PostgreSQL, MongoDB)
```

**Example usage:**

```typescript
const runtime = createRuntime(contract, aiProvider, {
  storage: new RedisAdapter({ url: "redis://localhost" }),
  storageKey: "clp:counter", // namespace for state
  persistOnCommit: true, // save after each commit
  hydrateOnInit: true, // load previous state on startup
});
```

---

### 2. Deep State Support (High Priority)

**Problem:** Can only manage flat state objects

**Solution:** Support nested paths with dot notation

```typescript
// Contract definition with nested state
const contract = createContract({
  state: {
    user: {
      profile: { name: "string", email: "string" },
      settings: { notifications: "boolean" },
    },
  },
  transitions: {
    updateName: {
      when: (ctx) => ctx.intent.complete,
      effects: (ctx) => ({
        "user.profile.name": ctx.intent.payload.name, // dot notation
      }),
    },
  },
});
```

**Implementation:**

- Parse dot-notation paths in transition effects
- Deep merge with existing state
- Support array operations (push, splice, filter)

---

### 3. Middleware System (Medium Priority)

**Problem:** Hard to integrate with external systems

**Solution:** Add before/after hooks

```typescript
interface Middleware {
  name: string;
  beforeDispatch?: (intent: Intent) => void | Promise<void>;
  afterDispatch?: (intent: Intent, log: LogEntry) => void | Promise<void>;
  beforePropose?: (intent: Intent) => void | Promise<void>;
  afterPropose?: (intent: Intent, proposal: Proposal) => void | Promise<void>;
  beforeCommit?: (intent: Intent) => void | Promise<void>;
  afterCommit?: (intent: Intent, log: LogEntry) => void | Promise<void>;
  onGuardDeny?: (guard: Guard, context: Context) => void | Promise<void>;
  onError?: (error: Error, phase: string) => void | Promise<void>;
}
```

**Use cases:**

- Analytics tracking
- Audit logging to external services
- Webhook notifications
- Rate limiting
- Circuit breaker

---

### 4. Schema Validation (Medium Priority)

**Problem:** No runtime type checking

**Solution:** Integrate with Zod

```typescript
import { z } from "zod";

const intentSchema = {
  increment: z.object({
    amount: z.number().optional(),
  }),
};

const runtime = createRuntime(contract, aiProvider, {
  validation: {
    strict: true, // throw on validation failure
    schema: intentSchema,
  },
});
```

---

### 5. Async Transitions (Medium Priority)

**Problem:** Transitions can't perform async side effects

**Solution:** Support promises in effects

```typescript
const contract = createContract({
  transitions: {
    sendNotification: {
      when: (ctx) => ctx.intent.name === "notify",
      effects: async (context) => {
        // Async side effects
        await sendEmail(
          context.intent.payload.to,
          context.intent.payload.message,
        );
        // Still return state changes
        return { lastNotifiedAt: new Date().toISOString() };
      },
    },
  },
});
```

**Considerations:**

- Handle partial failures (state rollback?)
- Timeout support
- Idempotency keys

---

### 6. Enhanced Guard System

**Current:** Guards only deny

**Proposed:** Guards can also suggest corrections

```typescript
interface Guard {
  name: string;
  deny: (context: Context) => boolean;
  suggest?: (context: Context) => Partial<IntentPayload>;  // NEW
}

// Example: guard suggests valid values
{
  name: 'valid_email',
  deny: ctx => !isValidEmail(ctx.intent.payload.email),
  suggest: ctx => ({ email: generatePlaceholderEmail() })
}
```

---

### 7. Event Sourcing (Future)

**Idea:** Store all state changes as events

```typescript
interface EventStore {
  append(event: Event): Promise<void>;
  getEvents(aggregateId: string): Promise<Event[]>;
  replay(aggregateId: string): State;
}
```

---

### 8. saga/Workflow Support (Future)

**Idea:** Multi-step workflows with compensation

```typescript
interface Saga {
  steps: {
    [key: string]: {
      intent: string;
      compensate?: (context: Context) => void; // rollback
    };
  };
}
```

---

## Version Roadmap

| Version | Focus                      | Target  |
| ------- | -------------------------- | ------- |
| 0.2.0   | Persistence + Deep State   | Q2 2026 |
| 0.3.0   | Middleware + Async         | Q3 2026 |
| 0.4.0   | Schema Validation          | Q4 2026 |
| 1.0.0   | Event Sourcing + Stability | Q1 2027 |

---

## Priority Matrix

```
                    Impact
                  Low    High
              ┌──────────┬──────────┐
       High   │ Schema   │State     │
              │Validation│Persistence│
Effort        ├──────────┼──────────┤
       Low    │Async     │Middleware│
              │Transitions          │
              └──────────┴──────────┘
```

---

## Contributing

Ideas and PRs welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

_Last updated: 2026-03-02_
