# AGENTS Guide (Fishing Monorepo)

This file defines how agents must work in this repository.

## 1) Source of truth

- **Canonical project state is documented in:** `apps/docs/docs/*`
- Required core pages:
  - `apps/docs/docs/index.md`
  - `apps/docs/docs/architecture.md`
  - `apps/docs/docs/mvp-scope.md`
  - `apps/docs/docs/shared-code-plan.md`
- If any root-level docs or notes differ, `apps/docs/docs/*` is authoritative.

## 2) Repository map (quick)

- `apps/web` - Next.js public web app (map + forecast MVP)
- `apps/mobile` - Expo mobile app
- `apps/admin` - Next.js admin app
- `apps/api` - NestJS API
- `apps/docs` - Docusaurus docs app
- `packages/domain-*`, `packages/shared-zod`, `packages/api-client`, `packages/shared-ui` - shared domain/contracts/client/UI

## 3) Working rules for agents

1. Read relevant docs in `apps/docs/docs/*` first.
2. Implement requested change in code.
3. Verify implementation (at minimum: related typecheck/build/tests where applicable).
4. **Update `apps/docs/docs/*` in the same task** to reflect the new reality.
5. In final report, state exactly which docs were updated.

## 4) Documentation update policy (mandatory)

- After each fixed/merged change, docs must be updated in the same delivery cycle.
- Minimum requirement:
  - Update feature scope in `mvp-scope.md` when behavior changes.
  - Update system/runtime details in `architecture.md` when architecture/runtime behavior changes.
  - Update reuse/boundaries in `shared-code-plan.md` when shared-vs-platform decisions change.
  - Keep `index.md` accurate as the docs entry point.

## 5) What to check before finishing

- Does implementation match current docs?
- Do docs describe user-visible behavior and technical constraints?
- Are LAN/deployment/hydration/runtime caveats still accurate?
- Are new env vars / routes / UX rules documented?

## 6) Useful commands

From repository root:

- `pnpm --filter @fishing/web typecheck`
- `pnpm --filter @fishing/web build`
- `pnpm docs:serve`
- `pnpm docs:build`

## 7) Scope discipline

- Implement exactly requested changes.
- Do not invent new features outside request.
- If behavior changed, documentation change is not optional.
