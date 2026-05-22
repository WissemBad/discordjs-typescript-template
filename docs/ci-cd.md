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
