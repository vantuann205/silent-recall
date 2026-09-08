# Contributing

Use Node 24, pnpm 10.30.3 and Compact 0.31.1. Follow the README to compile generated artifacts before testing.

Keep changes within Wave 1 unless a separate scope proposal is approved. Use small Conventional Commits and tests for changed behavior. Never commit credentials, `.env.local`, generated proving artifacts or screenshots with secret values.

Before a pull request, run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm contract:test`, `pnpm test:e2e` and `pnpm build`. Contract changes also require a full compile and `pnpm test:integration`. Explain public/private disclosure changes explicitly.

Do not weaken coverage, skip tests or replace genuine contract tests with mocks to obtain a green check. Report infrastructure failures separately from successful runs.
