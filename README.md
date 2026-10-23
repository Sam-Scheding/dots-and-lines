# dots-and-lines

Unstyled building blocks for draggable dots connected by lines. See
[docs/architecture-and-api.md](./docs/architecture-and-api.md).

## Workspaces

| Folder            | Package                      | Published |
| ----------------- | ---------------------------- | --------- |
| `packages/core/`  | `@dots-and-lines/core`       | yes       |
| `packages/react/` | `@dots-and-lines/react`      | yes       |
| `playground/`     | `@dots-and-lines/playground` | no        |

## Setup

```bash
nvm use
corepack enable
yarn install
yarn dev        # starts the playground
```

## Scripts

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `yarn dev`              | Start the playground (Vite)               |
| `yarn build`            | Build `core` then `react` into `dist/`    |
| `yarn build:playground` | Production build of the playground        |
| `yarn test`             | Run Vitest in `core` and `react`          |
| `yarn typecheck`        | `tsc --noEmit` in every workspace         |
| `yarn lint`             | ESLint                                    |
| `yarn format`           | Prettier write (`format:check` to verify) |
| `yarn changeset`        | Record a change for release               |

## How packages resolve in development

Each published package exports a `source` condition pointing at
`src/index.ts`. The playground and the `react` tests enable that condition, so
`@dots-and-lines/core` is read straight from TypeScript source and edits show up
immediately, with no rebuild. Published consumers never use `source`; they get
`dist/index.js` and `dist/index.d.ts`.

`core` is DOM-free: its `tsconfig.json` omits the `DOM` lib, so using `window`
or `document` there is a type error.
