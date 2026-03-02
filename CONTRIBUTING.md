# Contributing to Contract Language Protocol (CLP)

Thank you for your interest in contributing to CLP!

---

## Code of Conduct

By participating in this project, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yav-ai/clp.git
cd clp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

---

## Project Structure

```
clp/
├── packages/
│   └── clp/                 # Core runtime library
│       └── src/
│           ├── engine.ts    # Main execution engine
│           ├── runtime.ts   # Runtime factory
│           ├── contract.ts   # Contract definitions
│           ├── guard.ts      # Guard interfaces
│           ├── intent.ts    # Intent types
│           ├── transition.ts # Transition types
│           └── log.ts       # Audit logging
├── examples/
│   ├── counter/            # Simple counter example
│   ├── flight/             # Flight booking example
│   └── reminder/           # Reminder example
└── ROADMAP.md             # Future plans
```

---

## How to Contribute

### Reporting Bugs

1. Search existing issues first
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

### Suggesting Features

1. Check the [ROADMAP](./ROADMAP.md) first
2. Open a discussion issue
3. Explain the use case and proposed API

### Pull Requests

#### PR Process

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure tests pass: `npm test`
6. Commit using conventional commits (see below)
7. Push and open a PR

#### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Examples:**

```
feat(engine): add support for async transitions
fix(guard): resolve guard evaluation order
docs(readme): update API usage examples
test: add tests for deep state merge
```

---

## Development Guidelines

### TypeScript

- Use strict mode
- Prefer interfaces over types for public APIs
- Document complex logic with JSDoc

### Testing

- Aim for 100% coverage on runtime code
- Test edge cases, not just happy paths
- Use descriptive test names

```typescript
// Good
it("should throw when guard denies access to restricted resource");

// Avoid
it("should work correctly");
```

### Code Style

- Use meaningful variable names
- Keep functions small and focused
- Extract magic numbers into constants

---

## Release Process

1. Maintainer merges PR to main
2. Version bump based on conventional commits:
   - `feat` → minor release
   - `fix` → patch release
   - `BREAKING CHANGE` → major release
3. GitHub Actions publishes to npm

---

## Resources

- [Documentation](./README.md)
- [ROADMAP](./ROADMAP.md)
- [Issue Tracker](https://github.com/yav-ai/clp/issues)

---

## Questions?

- Open a discussion: https://github.com/yav-ai/clp/discussions
- Email: hello@yav.ai

Thank you for helping make CLP better!
