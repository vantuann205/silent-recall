# Verification

## Test Layers

| Layer                     | What it establishes                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 26 Compact circuit tests  | Generated contract authority, registration, campaign transitions, private predicates and time boundaries           |
| TypeScript / React tests  | Strict schemas, entropy/encoding/masking, public projections, witness cleanup, wallet v4, forms and session states |
| Real local-network runner | Actual deployment, proof generation, transaction balancing/submission, indexer confirmation and rejection paths    |
| 21 Playwright tests       | Seven independent journeys on Chromium, Pixel 7 mobile Chrome and Firefox, including axe scans                     |

There are **67 passing Vitest tests across 16 files**, including the 26 contract tests. No skipped or exclusive tests are committed. Playwright uses the compiled-contract development gateway, not a network wallet; **Playwright itself does not validate ZK cryptography**.

## Coverage

Measured with Vitest V8 on 9 September 2026:

| Metric                                                  | Result     |
| ------------------------------------------------------- | ---------- |
| Overall lines                                           | 87.50%     |
| Statements                                              | 86.31%     |
| Functions                                               | 88.54%     |
| Branches                                                | 77.53%     |
| Domain validation and cryptographic utilities           | 100% lines |
| Real contract gateway, private state and public mapping | 100% lines |
| Wallet connector and provider adapter                   | 100% lines |

Coverage includes session providers and shared application components, not just easy utilities. Generated compiler output, third-party shadcn primitives and route composition are not in the unit coverage denominator. The shell is primarily exercised by Playwright; polling/error branches still have lower unit coverage. Thresholds enforce 90% for domain/privacy utilities, 85% for core gateway files and 75% overall lines.

## Executed Commands

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm contract:compile
pnpm contract:test
pnpm test:integration
pnpm test:e2e
pnpm build
pnpm audit --prod
```

The local command runs use Windows, Node 24, WSL Ubuntu Compact 0.31.1 and Docker Desktop. The clean-install check clones tracked source into a separate ignored directory, installs the frozen lockfile without copying node_modules or generated artifacts, compiles all five circuits, typechecks, runs contract tests and builds Next.js. A nested-clone workspace-root warning is harmless; the same clone at a standalone path has no parent workspace.

Compiler output currently has a source-map warning about unavailable generated source paths on Windows. The circuits are executed and all assertions pass; the warning is not suppressed or treated as proof evidence.

## Genuine Proof Evidence

The final successful isolated local run completed at `2026-09-08T11:28:55.974Z`, network `undeployed`, contract `e5ff833d84613cacdad8264133adbca4df42a68962111a353aa07a54f39bc79d`. An earlier independent successful run completed at `2026-09-08T11:01:21.025Z`.

Its checks: deployment, authority initialization, commitment registration, indexed campaign creation, valid eligibility proof, wrong-batch rejection and closed-campaign rejection. Products: 1; accepted eligibility checks: 1. Each rerun deploys a fresh address and writes `.local/integration-result.json`. The local network is disposable; an address is not a public explorer deployment.

## Browser and Visual Evidence

All 21 tests passed locally without retries. Each browser context starts from an independent in-memory contract. One worker avoids concurrent on-demand Next.js compilation resetting another test's development session. Do not edit source while running browser tests. Failure traces, videos and screenshots go to ignored artifact directories.

The Wave 1 UI refinement checks cover reduced-motion preferences, keyboard-operated credential details and dismissible notifications. Browser automation uses the installed Playwright runner because the Browser plugin is unavailable. Contract code is unchanged; recorded proof evidence remains from 8 September rather than a new network run.

Major-page axe scans include overview, manufacturer, customer, privacy and docs. Layout checks include 320px width. The critical issuance/import/proof/close journeys run on desktop and mobile. Privacy assertions verify no serial/secret/salt in rendered text, URLs or console output, and no localStorage/sessionStorage credential persistence.

Real UI screenshots in `docs/assets` cover desktop 1440px, tablet 768px, mobile 393px, empty manufacturer, validation error, import loading, eligible and ineligible states. `pnpm exec tsx scripts/screenshots.ts` recreates them against a running demo server at port 3217. The loading capture holds `File.text()` in the browser test only, then resumes the real import code; no production test hook is installed. Screenshots display simulation labels, never claim an on-chain proof, and contain no raw private credential values.

## CI and Security Boundaries

[CI](https://github.com/vantuann205/silent-recall/actions/workflows/ci.yml) installs the pinned toolchain, compiles Compact, checks formatting/lint/types, runs coverage/contract tests, builds Next.js and runs all browser/accessibility projects. A manually triggered Docker-backed proof workflow is also provided; local integration results are separate from browser simulation.

`pnpm audit --prod` reported no known vulnerabilities on 8 September 2026. Source checks found no raw credential logging, dangerous HTML injection, secret environment variables or credential browser persistence. This is not a security audit or a guarantee against future advisories.

Not executed: public preview deployment and an interactive funded Lace browser signing session. No external funded preview wallet or configured hosting infrastructure was supplied. The genuine SDK-wallet local-network path and connector-v4 adapter tests are executed instead, with that distinction explicit.
