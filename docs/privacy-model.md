# Privacy Model

| Data                                                                                | Location / disclosure                                     |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Serial, product secret, salt                                                        | Browser memory; explicit unencrypted JSON download        |
| Full credential opening                                                             | Browser memory and trusted proving provider               |
| Manufacturer authority secret                                                       | Issuer memory; local integration key in ignored `.local/` |
| Manufacturer authority hash                                                         | Public contract state                                     |
| Hiding product commitment                                                           | Public registry and eligibility transaction               |
| Campaign ID, model/batch, safety notice, dates, warranty requirement, planned value | Public ledger                                             |
| Product/campaign/check counts                                                       | Public ledger                                             |
| Customer identity, purchase location/price, ownership history                       | Not collected                                             |

An eligibility proof demonstrates knowledge of a registered commitment opening satisfying the public campaign. It does not disclose the raw serial, secret, salt or exact private purchase date. `issuedAt` and `credentialVersion` are local schema metadata; they are not part of the cryptographic ownership predicate.

## Important limitations

SilentRecall cannot independently prove that a physical product exists. Wave 1 trusts the manufacturer's issuance and commitment-registration process.

The manufacturer originally knows the issued credential and can retain it. The JSON file is a bearer secret, not encrypted wallet storage. Anyone obtaining it can prove eligibility. Issuance authenticity does not prove exclusive ownership.

The public set reveals which hiding commitment is used. Repeated checks can be linked. Transactions, wallet funding, IP addresses and timing may create additional correlations. This project does not guarantee anonymity or hide all wallet history.

The wallet's proving provider receives private witness material. Run it locally on a trusted machine. The application does not upload raw credentials to a Next.js backend. A remote prover must not be described as device-local privacy.

Secrets are not stored in localStorage, sessionStorage, query strings or application logs. Error strings are allowlisted rather than reflecting library exceptions. Query caches contain public data only. Exported files are outside the app's control; browser downloads, backups, malware and screenshots of external editors remain risks.

Wave 1 has no replay prevention, revocation, ownership transfer or compensation entitlement. These are explicitly outside its scope.
