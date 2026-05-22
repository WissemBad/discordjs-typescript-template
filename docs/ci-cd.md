# CI/CD

Two GitHub Actions workflows are included.

## CI

`.github/workflows/ci.yml` runs on pull requests, pushes to `main` and manual dispatch:

- install with `bun install --frozen-lockfile`
- generate Prisma client
- run Biome
- run TypeScript typecheck
- run Bun tests
- run the Bun build
- build the Docker image

The workflow uses a local SQLite file through `DATABASE_URL=file:./ci.db`, so no GitHub secrets are required for template validation.

## Releases

`.github/workflows/release.yml` runs when a tag matching `v*` is pushed:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The release workflow re-runs the quality gate, builds the Docker image, creates `.zip` and `.tar.gz` source archives, writes `SHA256SUMS.txt`, and attaches the assets to a GitHub Release.

## Deployment

This template does not deploy to a server by default. Production hosting differs too much between projects, and a fake deploy step would be worse than no deploy step. Add a separate environment-specific workflow once the target is known.

## Dependabot

`.github/dependabot.yml` keeps Bun dependencies, GitHub Actions, Docker and Docker Compose references fresh.

The auto-merge workflow is intentionally conservative:

- patch updates are approved and marked for auto-merge;
- minor updates are auto-merged only when they are not direct production dependencies;
- major updates and production minor updates are labeled `manual-review`;
- branch protection should require the CI checks before merging.

Enable **Allow auto-merge** in the repository settings for the workflow to merge after required checks pass.
