# Hookable

Lightweight, type-safe, zero-dependency awaitable hook system.

**Important:** Keep AGENTS.md updated with project info.

## Project Overview

- **Type:** ESM-only (`"type": "module"`)
- **Runtime deps:** None
- **Bundle size:** Hookable < 3KB, HookableCore < 630B gzipped

Two classes:

- **`Hookable<HooksT>`** — Full-featured: deprecation chains, beforeEach/afterEach spies, serial & parallel execution
- **`HookableCore<HooksT>`** — Minimal: only `hook()`, `removeHook()`, `callHook()` (~630B)

## Source Structure

```
src/
├── index.ts       # Public exports
├── types.ts       # TypeScript type definitions (generics, inference)
├── hookable.ts    # Hookable & HookableCore classes
├── utils.ts       # flatHooks, mergeHooks, callers (serial/parallel)
└── debugger.ts    # createDebugger utility
```

## Key Exports

```typescript
// Classes
export { Hookable, HookableCore, createHooks }

// Utilities
export { flatHooks, mergeHooks, parallelCaller, serial, serialCaller }

// Debugger
export { createDebugger }
```

## Development

**Setup:** `eval "$(fnm env --use-on-cd 2>/dev/null)"` then `pnpm install`

| Command | Purpose |
|---------|---------|
| `pnpm build` | Build with obuild (esbuild) |
| `pnpm dev` | Vitest watch mode |
| `pnpm test` | Lint + vitest with coverage |
| `pnpm lint` | oxlint + oxfmt check |
| `pnpm lint:fix` | Auto-fix lint/format |
| `pnpm test:types` | Type check with tsgo |
| `pnpm bench` | Benchmarks with mitata |
| `pnpm release` | test → build → changelogen release |

## Testing

- **Framework:** Vitest
- **Tests:** `test/hookable.test.ts`, `test/types.test.ts`, `test/debuger.test.ts`, `test/bundle.test.ts`
- **Run single:** `pnpm vitest run test/hookable.test.ts`
- Uses `expectTypeOf` for type-level assertions
- Bundle size enforced in `test/bundle.test.ts`

## Code Conventions

- ESM with explicit `.ts` extensions in imports
- No barrel files — import directly from modules
- Internal helpers at end of file
- Multi-arg functions use options object as 2nd param
- Constructor binds `hook`, `callHook`, `callHookWith` for safe destructuring
- Unregister functions nullify references for GC cleanup
- `console.createTask()` support for DevTools stack traces

## Linting & Formatting

- **Linter:** oxlint (config: `.oxlintrc.json`)
- **Formatter:** oxfmt (config: `.oxfmtrc.json`)

## Build & Publish

- **Builder:** obuild → `dist/index.mjs` + `dist/index.d.mts`
- **TypeScript:** ESNext target, NodeNext modules, strict, `isolatedDeclarations`
- **CI:** GitHub Actions — lint → type check → test + coverage → codecov
- **Release:** `changelogen --release --publish --push`
- Only `dist/` published to npm
