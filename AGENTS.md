# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by npm workspaces under `apps/*`:
  - `apps/backend`: NestJS API with Prisma (`src/`, `prisma/`, tests in `test/`).
  - `apps/frontend`: Vite + React UI (`src/`, assets in `public/`).
  - `apps/cli`: TypeScript CLI (`src/`, executable in `bin/`).
- Supporting folders: `docs/` (guides), `infra/` (deployment), `utilities/` (scripts), `.logs/` (CI/local logs).
- Docker: `docker-compose*.yml` for local/prod orchestration.

## Build, Test, and Development Commands
- Root orchestration (preferred):
  - `npm run dev`: run backend (watch) and frontend (vite) together.
  - `npm run build`: build backend, frontend, and CLI (logs in `.logs/*-build.log`).
  - `npm run lint` · `npm run typecheck` · `npm test`: run across all workspaces (logs in `.logs/`).
  - `npm run test:e2e`: run backend e2e tests.
  - `npm run db:migrate|db:seed|db:reset`: Prisma via backend workspace.
- Target a workspace: `npm run <script> --workspace=backend` (or `frontend`, `cli`).
- Local env helper: `npm run dev:local` (see `utilities/development/local-dev.sh`).

## Coding Style & Naming Conventions
- Language: TypeScript across all apps.
- Tools: ESLint + Prettier (2‑space indent, semicolons default). Run `npm run lint` and `npm run format` where available.
- Naming: camelCase for variables/functions, PascalCase for classes/React components, kebab-case for filenames. See `docs/NAMING-CONVENTIONS.md` for details.

## Testing Guidelines
- Backend: Jest (`*.spec.ts`), coverage to `apps/backend/coverage/`. E2E config at `apps/backend/test/jest-e2e.json`.
- Frontend: Vitest + Testing Library (`*.test.tsx`/`*.spec.tsx`). Setup in `apps/frontend/src/test/setup.ts`.
- CLI: Jest (`*.spec.ts`).
- Run all: `npm test`. Focused: `npm run test --workspace=frontend`. Coverage: `npm run test:cov` (backend).

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:` with concise, imperative subject. Scope optional (e.g., `feat(backend): ...`).
- PRs must include:
  - Clear description and linked issues (`Closes #123`).
  - Screenshots for UI changes; sample logs for CLI/backend (from `.logs/`).
  - Notes on DB schema changes with Prisma migration and seed included.
  - Passing CI (lint, typecheck, tests, build).

## Security & Configuration
- Do not commit secrets. Copy from examples: `apps/backend/.env.example`, `apps/frontend/.env.local.example`.
- Prefer Docker for local services; use `db:reset` cautiously (destroys data).
