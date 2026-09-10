# Vercel Deployment

This deployment hosts the Wave 1 frontend. It does not deploy a Midnight
contract, run a node or host a proof server. Production simulation is disabled.

## Project

- Account/team: `van-tuans-projects-8ccc329d`
- Project: `duan1-midnight-grant`
- Repository: `vantuann205/silent-recall`
- Production branch: `main`
- Root directory: repository root
- Runtime: Node 24; package manager: pnpm 10.30.3

Vercel is connected to GitHub. Pushes to the production branch trigger a build.
For a manual deployment, authenticate to the same team and run:

```sh
npx --yes vercel@59.15.1 deploy --prod --scope van-tuans-projects-8ccc329d
```

`vercel.json` installs the frozen lockfile and runs `scripts/vercel-build.sh`.
The script installs Compact manager 0.5.2 and compiler 0.31.1, compiles all ZK
circuits, copies their assets to `public/zk`, then runs the Next.js production
build. Compiler downloads require outbound access to GitHub. A fresh Git clone
does not contain generated contracts; do not replace compilation with `--fast`.

## Public Configuration

The build defaults to Preprod and forces simulation off. No secret environment
variables are required to host the frontend.

| Variable                       | Configuration                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_MIDNIGHT_NETWORK` | Defaults to `preprod` in the Vercel build script                                                        |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Leave unset until a real Preprod contract is deployed, then supply its 64-character hexadecimal address |
| `NEXT_PUBLIC_INDEXER_HTTP`     | Defaults to `https://indexer.preprod.midnight.network/api/v4/graphql`                                   |
| `NEXT_PUBLIC_INDEXER_WS`       | Defaults to `wss://indexer.preprod.midnight.network/api/v4/graphql/ws`                                  |
| `NEXT_PUBLIC_ENABLE_DEMO`      | Forced to `false` by the build script                                                                   |

These values are embedded at build time; redeploy after changing them.
Browser proving uses the connected wallet's proving configuration. Vercel does
not make a visitor's local proof service available. Connect a compatible Lace
extension on Preprod and configure a trusted prover before transaction testing.

Until the contract address is configured, the UI can be inspected, but contract
connection and on-chain workflows remain unavailable. A successful web build is
not evidence of a successful Preprod transaction.

## Local Data Safety

`.vercelignore` excludes `.local`, environment files, wallet tooling, private-key
formats, generated artifacts and local build output from CLI uploads. `.gitignore`
also excludes the wallet inventory and Vercel's local project metadata. Never add
mnemonics, authority secrets or service credentials to `NEXT_PUBLIC_*` variables,
the repository, `public`, or application source.

Verify the deployment reaches `Ready`, open its production URL and check the
manufacturer and owner routes. Verify `/zk/keys/` artifacts through their exact
generated filenames; directory listing is not expected. Validate actual wallet
transactions separately after deploying the contract.
