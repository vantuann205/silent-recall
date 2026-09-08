# Five-Minute Demonstration

## Browser walkthrough (clearly labelled simulation)

1. Compile the contract, set `NEXT_PUBLIC_ENABLE_DEMO=true` in `.env.local`, leave the contract address empty, run `pnpm dev`.
2. Open `/manufacturer`, choose **Start local demo**, then **Authorize local issuer**.
3. Choose **Issue credential**. Use model `KETTLE-01`, batch `BATCH-2026`, a demonstration serial, a past purchase date and warranty enabled.
4. Generate/register, then download the credential JSON. Do not show its secret contents on screen.
5. Return to manufacturer and create `RECALL-001`, matching the model/batch, with opening in the past and expiration in the future. Set an inclusive purchase range and a clear safety notice.
6. Open **Customer**, import the file, choose the recall and verify. The result explicitly states that local simulation is not an on-chain ZK proof.
7. Close the campaign through the confirmation dialog; repeat the customer check and observe rejection.

The demo state is isolated to the tab and resets on reload. Restarting or changing source code during Next.js development can also reload the session. Do not use genuine customer credentials.

## Genuine proof

```sh
docker compose up -d --wait
pnpm contract:compile
pnpm test:integration
```

This deploys a fresh contract and executes registration, campaign creation, a real proof accepted by the local ledger, wrong-batch rejection, closing and closed-campaign rejection. It writes only a public result summary and a separately ignored local authority key. No browser extension or external test funds are required.

## Real browser wallet

Configure a connector-v4-compatible Midnight Lace wallet for network `undeployed`, node `ws://127.0.0.1:19944`, indexer HTTP `http://127.0.0.1:18088/api/v4/graphql`, WS `ws://127.0.0.1:18088/api/v4/graphql/ws`, and local prover `http://127.0.0.1:16300`. The wallet needs local DUST; do not import the public development seed into a wallet holding real assets.

Set `NEXT_PUBLIC_CONTRACT_ADDRESS` from `.local/deployment.json`, disable the simulation and restart Next.js. Unlock the issuer with `.local/manufacturer.key` through the password input. The integration test's campaign is deliberately closed; create a new campaign for browser checks.

The browser connector is unit-tested against its v4 API contract. The genuine network integration uses the SDK wallet. An interactive funded Lace browser session and public preview deployment are not claimed as executed.
