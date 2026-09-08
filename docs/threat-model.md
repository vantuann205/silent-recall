# Threat Model

Status: engineering review and automated checks, **not independently audited**.

| Threat                               | Mitigation / residual risk                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Fake credential                      | Reconstructed commitment must be manufacturer-registered. Stolen genuine files still work.                              |
| Unauthorized issuer                  | Constructor-bound authority hash and secret witness checked on every administrative circuit.                            |
| Guessable commitment                 | Independent cryptographic 256-bit secret and salt; strict input bounds. Issuer must use the generator honestly.         |
| File theft                           | Memory-first handling, masked summaries, explicit unencrypted-backup warning. No protection after file theft.           |
| Console / exception leakage          | No raw credential logging; safe error allowlist and regression checks.                                                  |
| URL leakage                          | Only public campaign IDs in routes; no credential values in navigation.                                                 |
| Persistence leakage                  | No browser credential persistence; private witness removed after operations. Downloads remain user-managed.             |
| Replay                               | Permitted in Wave 1. Check counter is not a unique-owner count or claim.                                                |
| Campaign tampering                   | Manufacturer-only creation/closing, unique IDs, no overwrite, immutable conditions.                                     |
| Incorrect time                       | Ledger-time constraints; opening inclusive and expiration exclusive, boundary tests. Device clock affects display only. |
| Compromised frontend / wallet        | Can steal private data. Review builds/dependencies, trusted local prover, no audit claim.                               |
| Physical-to-digital gap              | Issuer trusted to associate commitments with real products.                                                             |
| Malicious import                     | 16 KiB cap, strict Zod object, supported version, bounded ASCII fields and timestamps.                                  |
| Remote prover                        | Receives witness material. Use a trusted local prover; never send production secrets to an unknown endpoint.            |
| Availability / uncertain transaction | Safe error and retry, public-state refresh. A timeout can occur after acceptance; inspect state before retrying.        |

Administrative authority keys and wallet seeds must never use `NEXT_PUBLIC_*`. The checked-in local genesis seed and Docker passwords are deliberately public development-network constants, never funded public-network credentials. Docker ports bind only to loopback.

On-chain safety notices are public user-authored text, rendered by React without dangerous HTML. Client bounds are not a guarantee of semantic truth: a malicious authorized issuer can publish misleading recalls or arbitrary commitments.
