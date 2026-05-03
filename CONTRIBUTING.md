# Contributing to Kyrnox SENTRY

Thanks for your interest in Kyrnox SENTRY. This document covers the basics; please skim `docs/SENTRY.md` and `docs/threat-model.md` before submitting non-trivial changes.

## Developer Certificate of Origin (DCO)

By submitting a contribution you certify that you have the right to submit it and that you accept the [Developer Certificate of Origin](https://developercertificate.org). Sign your commits with `git commit -s`.

## Workflow

1. Fork and create a feature branch.
2. `npm install`, `npm run typecheck`, `npm run test:unit`, `npm run lint`.
3. Open a PR against `main`. CI must be green.
4. A maintainer will review. Stable v1 SDK exports may not change signature without a `BREAKING CHANGE` note in the PR description and a minor version bump.

## Code style

- TypeScript strict; Biome formatter (`npm run lint:fix`).
- All remote/external data is validated with **zod** before runtime use.
- Public API additions require a unit test and a `STUBS.md` update if they introduce a new stub.

## Reporting bugs

Open an issue with reproduction steps and the affected package. For security issues see `SECURITY.md`.
