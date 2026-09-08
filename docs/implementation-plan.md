# SilentRecall Wave 1 Implementation Plan

Approved scope: private recall eligibility, approximately 30% of the full roadmap.
Completion is gated by observed verification, never by the existence of files.

## Architecture

One Next.js App Router application and one Compact contract. A typed browser
gateway owns Midnight providers and wallet access. Credentials remain in memory;
JSON export is a demonstration backup. There is no application database. Local
development and browser tests have an explicitly labelled deterministic gateway.
Production always selects the real adapter.

Manufacturer authority is bound at deployment to a domain-separated secret hash.
Initialization requires knowledge of that secret, preventing first-caller takeover.
Only this authority can register commitments or manage campaigns. Eligibility
reconstructs a persistent commitment from private witness data. Ledger time
constraints enforce opening and expiration; a caller-supplied clock is insufficient.

## Reviewable Milestones

1. Project manifest, Next.js scaffold and repository publication.
2. Strict tooling, environment validation and test runners.
3. Credential validation and private encoding with boundary tests.
4. Campaign validation, safe summaries and domain errors.
5. Compact authority and executable access-control tests.
6. Commitment registry and duplicate-registration tests.
7. Campaign lifecycle and authorization/time tests.
8. Eligibility witness constraints and privacy/rejection tests.
9. Pinned Docker network, deployment and real proof integration.
10. Typed gateway and deterministic development adapter.
11. Real wallet connector, provider construction and network states.
12. Shared UI tokens, navigation and accessibility primitives.
13. Manufacturer credential generation, registration and download.
14. Campaign creation, detail, aggregate dashboard and closing.
15. Customer import, private proof and recovery workflows.
16. Landing, privacy explanation and reviewer documentation.
17. Component tests and privacy regressions.
18. Desktop/mobile/Firefox browser journeys and accessibility.
19. CI, security policy, contribution guidelines and license.
20. Final clean-install verification, real screenshots, documentation and tag.

Each milestone carries a relevant runnable check before its commit. Contract
simulation tests and real network proofs are reported separately. Final checks:
format, lint, strict TypeScript, unit/coverage, Compact compilation and tests,
local-network integration, browser tests, production build, clean Git status,
remote SHA and commit count. No Wave 2/3 implementation.

## Toolchain Sources

Verified 2026-09-08 against official Midnight quickstart, installation, Next.js
wallet connector, Compact reference and create-mn-app 0.5.1 upstream templates.
Baseline: Compact 0.31.1, runtime 0.16.0, Midnight.js 4.1.1, connector 4.0.1,
wallet SDK 1.2.0, node 1.0.0, indexer 4.3.3, proof server 8.1.0.
Compiler/runtime compatibility must be checked against generated output.

## Visual Direction

Quiet industrial product interface: white work surfaces, charcoal navigation,
emerald confirmations and amber safety notices. Bounded typography, square
logistics-label details, responsive tables and explicit private/public boundaries.
Target visual polish is the approved 70-80% production level.
