# Repository instructions

Read `C:\dev\CLAUDE.md` and complete its startup sequence before working here.

This repository is the isolated `Kontoret` game project. The story loop (five dilemmas, scoring, archetypes) landed 2026-08-27 and is documented in `STORY.md`. Do not add new systems (persistence, sharing, further dilemmas) without an explicit request.

Use `npm run build` (type check, balance check, bundle) and `npm test` (Playwright against the built site) for the required verification; both run in CI before deploy. Browser changes must be checked at desktop, portrait mobile, and short landscape sizes.

Visual acceptance means looking at rendered screenshots of the running build, never a functional checklist. Before proposing a plan that needs new art, spec how each asset is produced and how consistency with the accepted concept is guaranteed; do not composite separately generated images.
