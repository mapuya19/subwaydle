# AGENTS.md

Conventions and guidelines for AI agents working on this codebase.

## Project overview

Subwaydle Remastered — a Wordle-inspired NYC Subway daily puzzle game. Static React/TypeScript SPA deployed on Vercel.

## Tech stack

- **React 19** with TypeScript 5.9 (strict mode)
- **Vite 8** for dev server and production builds
- **Vitest 4** + Testing Library for unit tests
- **ESLint 9** flat config with typescript-eslint, react-hooks, react-refresh
- **Sass** for stylesheets (SCSS syntax)
- **Semantic UI React** for UI components (with React 19 compatibility shim)
- **Mapbox GL 3** for subway map rendering
- **Yarn 4** (Berry) for package management

## Commands

```sh
yarn start        # Dev server
yarn build        # Production build
yarn test         # Run all tests (vitest)
yarn lint         # Run ESLint
npx tsc --noEmit  # TypeScript type check (no emit)
```

## Code conventions

### TypeScript

- **No `any` in source code.** Use proper types, `unknown`, or generics. The only exception is `src/polyfills/` which interfaces with untyped React internals.
- **Use `as const`** on GeoJSON type literals and other narrow string unions.
- **Prefer `unknown` over `any`** for type assertions: `(foo as unknown as TargetType)`.

### React

- **React 19 compatibility**: `semantic-ui-react` uses the removed `ReactDOM.findDOMNode` API. The shim at `src/polyfills/fluentui-react-component-ref.tsx` provides a replacement. It's wired in via `resolve.alias` in both `vite.config.ts` and `vitest.config.ts`.
- **Refs vs. useState**: Use refs for write-once side-effect state that doesn't drive rendering. Use useState when the value is read during render. Note: React 19's `react-hooks/refs` rule flags `.current` access during render — design accordingly.
- **Context pattern**: Context files co-locate providers with hooks (e.g., `GameContext.tsx` exports both `GameProvider` and `useGame`). This is intentional and allowed via `allowExportNames` in ESLint config.

### ESLint

- **Target: zero errors, zero warnings.** No blanket rule disables.
- **Suppressions must be justified.** Each override in `eslint.config.js` has an inline comment explaining why.
- **`react-hooks/set-state-in-effect`** is disabled globally because it has no configuration options and all 7 flagged usages are intentional patterns.
- **ESLint 10 upgrade blocked** by `eslint-plugin-react-hooks` which doesn't declare `eslint@10` peer dep yet.

### Testing

- Tests live alongside source files (`*.test.ts` / `*.test.tsx`).
- Use proper types in tests — no blanket `any` overrides. Import real types from source.
- Mock modules with typed factories (e.g., `createMockModule`).

### File organization

```
src/
├── components/
│   ├── game/         # Game grid, rows, keys
│   ├── modals/       # About, Settings, Solution, Stats, Practice
│   └── ui/           # Countdown, MapFrame, Toast, Header
├── contexts/         # React contexts (Game, Settings, DarkMode, Stats)
├── data/             # JSON data files (routes, stations, shapes, solutions, answers)
├── hooks/            # Custom hooks (useGameData, useGameState, useKeyboard, usePracticeMode)
├── polyfills/        # React 19 compatibility shim
└── utils/            # Shared utilities, types, constants
```

### Git

- **Author**: `Matthew Apuya <m.apuya19@gmail.com>`
- **Commit style**: Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`)
- **Branch naming**: `feat/description`, `fix/description`

### Dependencies

- Peer dependency warnings for `semantic-ui-react` (expects React 16/17) are suppressed via `.yarnrc.yml` `logFilters`.
- Zero vulnerabilities policy — keep all deps at latest compatible versions.
- `mapbox-gl` is chunked as `vendor-mapbox` in the Vite build config for performance.
