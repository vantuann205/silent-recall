# Architecture

SilentRecall is one Next.js App Router application and one Compact contract. There is no application database, credential-upload endpoint, analytics SDK or separate backend.

```mermaid
flowchart LR
  Issuer[Manufacturer browser] -->|hiding commitment| Wallet[Midnight wallet]
  Customer[Customer browser memory] -->|private witness| Prover[Trusted local prover]
  Prover -->|proof| Wallet
  Wallet --> Ledger[Midnight contract]
  Ledger --> Indexer[Public indexer]
  Indexer --> UI[Public dashboard]
```

## Boundaries

- `contract/src`: authority-bound registry, immutable campaign conditions, eligibility predicates and aggregate counters.
- `src/lib/validation`: bounded Zod credential/campaign schemas, date semantics and masked summaries.
- `src/lib/crypto`: fixed 32-byte encoding and the generated Compact commitment primitive. No independently reimplemented hash.
- `src/lib/midnight`: typed gateway, public projections, memory-only witness provider and safe error mapping.
- `src/features`: issuer, campaign, credential, proof and connector-v4 workflows.
- `src/providers`: query caching and wallet session lifecycle. Public queries refresh every 30 seconds; connection status every 5 seconds.

The real gateway invokes generated circuits through Midnight.js, waits for finalized/indexed results, and removes private witnesses in `finally`. One transaction at a time is permitted per gateway to prevent witness races. Refreshing the browser discards session secrets. A manufacturer must reauthorize after disconnecting.

The development gateway executes the same generated Compact contract in memory. It is gated by both a development build and `NEXT_PUBLIC_ENABLE_DEMO=true`. It is not a cryptographic proof or substitute for the separate real-network integration test.

## Contract design

The constructor commits to an authority secret and manufacturer ID. Initialization proves knowledge of that secret; it is not a first-caller-wins administrator. Every administrative circuit repeats the authority check.

Product commitments use Compact `persistentHash` with a domain separator, five encoded identifiers/fields, purchase date, warranty flag, 256-bit secret and independent 256-bit salt. The public set is deliberately simple for Wave 1. A scalable authenticated tree is later work, not a fake Merkle implementation.

Campaigns cannot be overwritten. Closing preserves metadata and permanently disables checks. Opening is inclusive, expiration exclusive; the circuit constrains ledger time rather than trusting a client timestamp. Purchase bounds are inclusive. Date-only purchase inputs use UTC; campaign opening/expiration inputs are local time converted to epoch seconds.

Successful checks increment a counter. It measures successful verifications, not unique customers, products claimed or compensation paid. No claim/nullifier/payment logic exists.
