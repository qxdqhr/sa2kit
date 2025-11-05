# Contributing to React Utils Kit

Thank you for your interest in contributing to React Utils Kit! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Getting Started

1. Fork and clone the repository

```bash
git clone https://github.com/your-username/react-utils-kit.git
cd react-utils-kit
```

2. Install dependencies

```bash
pnpm install
```

3. Run development mode

```bash
pnpm dev
```

4. Run tests

```bash
pnpm test
```

## Project Structure

```
react-utils-kit/
├── src/
│   ├── logger/         # Logger system
│   ├── utils/          # Utility functions
│   ├── hooks/          # React hooks
│   ├── storage/        # Storage adapters
│   └── index.ts        # Main entry point
├── tests/              # Test files
├── examples/           # Usage examples
├── docs/               # Documentation
└── dist/               # Build output (generated)
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add JSDoc comments for public APIs
- Update types as needed

### 3. Add Tests

```bash
# Add tests in tests/ directory
pnpm test

# Run with coverage
pnpm test:coverage
```

### 4. Lint and Format

```bash
# Check for linting errors
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### 5. Type Check

```bash
pnpm type-check
```

### 6. Build

```bash
pnpm build
```

### 7. Commit Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new utility function"
git commit -m "fix: resolve logger timezone issue"
git commit -m "docs: update API documentation"
git commit -m "test: add tests for string utils"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 8. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Provide explicit type annotations for public APIs
- Avoid `any` type - use `unknown` when type is truly unknown
- Use interfaces for object shapes
- Use type aliases for unions and primitives

### Naming Conventions

- **Files**: Use kebab-case (`my-component.ts`)
- **Classes**: Use PascalCase (`MyClass`)
- **Functions/Variables**: Use camelCase (`myFunction`)
- **Constants**: Use UPPER_SNAKE_CASE (`MAX_SIZE`)
- **Types/Interfaces**: Use PascalCase (`UserData`)

### Documentation

- Add JSDoc comments to all exported functions and classes
- Include `@param`, `@returns`, and `@example` tags
- Provide clear descriptions

Example:

```typescript
/**
 * Formats a file size in bytes to human-readable format
 *
 * @param bytes - The file size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 *
 * @example
 * ```ts
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1536000, 1) // "1.5 MB"
 * ```
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  // implementation
}
```

## Testing Guidelines

- Write unit tests for all new functionality
- Aim for >80% code coverage
- Use descriptive test names
- Test edge cases and error conditions

Example:

```typescript
import { describe, it, expect } from 'vitest';
import { stringUtils } from '../src/utils';

describe('stringUtils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(stringUtils.capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(stringUtils.capitalize('')).toBe('');
    });

    it('should not affect already capitalized string', () => {
      expect(stringUtils.capitalize('Hello')).toBe('Hello');
    });
  });
});
```

## Pull Request Process

1. Update documentation if you're adding/changing APIs
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md under [Unreleased] section
5. Request review from maintainers
6. Address review feedback
7. Wait for approval and merge

## Reporting Issues

When reporting bugs, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)
- Code samples or minimal reproduction

## Feature Requests

When suggesting features:

- Clearly describe the use case
- Explain why this would be useful
- Provide examples of how it would be used
- Consider backward compatibility

## Questions?

- Open a [Discussion](https://github.com/your-org/react-utils-kit/discussions)
- Ask in [Issues](https://github.com/your-org/react-utils-kit/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

