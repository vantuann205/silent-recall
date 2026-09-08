export default function Privacy() {
  return (
    <article className="wrap prose">
      <h1>Your product. Your privacy.</h1>
      <p>
        SilentRecall proves recall conditions from a private credential. It does
        not ask for your identity, receipt, purchase location or payment
        history.
      </p>
      <h2>What is disclosed?</h2>
      <table>
        <thead>
          <tr>
            <th>Public ledger</th>
            <th>Private credential</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Manufacturer authority hash</td>
            <td>Manufacturer authority secret</td>
          </tr>
          <tr>
            <td>Hiding product commitment</td>
            <td>Serial number, product secret, salt</td>
          </tr>
          <tr>
            <td>Campaign model and batch conditions</td>
            <td>Complete credential opening</td>
          </tr>
          <tr>
            <td>Aggregate successful check count</td>
            <td>Exact purchase date and warranty witness</td>
          </tr>
        </tbody>
      </table>
      <h2>What a successful check means</h2>
      <p>
        You know the opening of a manufacturer-registered commitment matching
        the campaign conditions. No claim, voucher or compensation entitlement
        is created. Repeat checks are possible; the count is not a count of
        unique owners.
      </p>
      <h2>The boundaries that matter</h2>
      <p>
        SilentRecall cannot independently prove that a physical product exists.
        Wave 1 trusts the manufacturer’s issuance and commitment-registration
        process.
      </p>
      <p>
        The public registry reveals the hiding commitment used for a check.
        Repeated checks for that commitment can be linked. Transaction timing,
        network metadata and wallet funding may also be observable. This is not
        a guarantee of complete anonymity.
      </p>
      <p>
        Your credential remains in browser memory. The exported JSON is an
        unencrypted demonstration backup, not production-grade wallet storage.
        Anyone with the file can repeat the eligibility check. Keep backups
        offline; do not upload them to support tickets.
      </p>
      <h2>Proof generation</h2>
      <p>
        A real proof is produced through your wallet’s configured proving
        provider. The prover receives private witness material. Use a trusted
        local prover on your device. No credential is posted to a Next.js
        backend, analytics service or application database.
      </p>
      <h2>Software security</h2>
      <p>
        This project has automated tests, but is not independently audited. A
        compromised frontend, wallet or device can expose secrets. Review the
        source and security model before use.
      </p>
    </article>
  );
}
