'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, LockKeyhole, CheckCircle2 } from 'lucide-react';
import { useRecall } from '@/providers/recall-provider';
import {
  createCredential,
  safeSummary,
  type Credential,
} from '@/lib/validation/credential';
import { dateSeconds } from '@/lib/validation/campaign';
import { safeError } from '@/lib/midnight/errors';
import { Button } from '@/components/ui/button';
import { Field, FormError, Loading } from '@/components/shared/form';
import { Authorization } from './authorization';
export function ProductForm() {
  const r = useRecall();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function register(c: Credential) {
    setBusy(true);
    setError('');
    try {
      if (!r.gateway) throw new Error();
      const { commitmentOf } = await import('@/lib/crypto/commitment');
      await r.gateway.register(commitmentOf(c));
      setRegistered(true);
      await r.refresh();
      r.notify('Product commitment registered.');
    } catch (e) {
      setError(safeError(e));
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!credential) return;
    const blob = new Blob([JSON.stringify(credential, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'silent-recall.credential.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="wrap">
      <Link className="back" href="/manufacturer">
        <ArrowLeft size={16} />
        Manufacturer
      </Link>
      <div className="page-head">
        <div>
          <h1>Issue product credential</h1>
          <p className="muted">
            A private opening for one product. Only its commitment is
            registered.
          </p>
        </div>
      </div>
      <Authorization />
      <div className="form-layout">
        <div>
          {credential ? (
            <>
              <div className={'notice ' + (registered ? 'success' : '')}>
                <CheckCircle2 />
                <span>
                  {registered
                    ? 'Commitment registered. Download the private credential now.'
                    : 'Credential created locally. Registration is pending.'}
                </span>
              </div>
              <dl>
                {Object.entries(safeSummary(credential)).map(([key, value]) => (
                  <div className="keyline" key={key}>
                    <dt>{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
              <div className="actions" style={{ marginTop: 24 }}>
                <Button onClick={download}>
                  <Download />
                  Download credential JSON
                </Button>
                {!registered ? (
                  <Button
                    variant="outline"
                    disabled={busy || !r.authorized}
                    onClick={() => void register(credential)}
                  >
                    Retry registration
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCredential(null);
                      setRegistered(false);
                    }}
                  >
                    Issue another product
                  </Button>
                )}
              </div>
            </>
          ) : (
            <form
              className="form"
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                const form = e.currentTarget;
                const f = new FormData(form);
                try {
                  const c = createCredential({
                    manufacturerId: r.data.manufacturerId,
                    modelId: String(f.get('model')),
                    batchId: String(f.get('batch')),
                    serialNumber: String(f.get('serial')),
                    purchaseDate: dateSeconds(String(f.get('purchase'))),
                    warrantyEligible: f.get('warranty') === 'on',
                  });
                  setCredential(c);
                  form.reset();
                  await register(c);
                } catch {
                  setError(
                    'Check the product fields. Purchase date cannot be in the future.',
                  );
                }
              }}
            >
              <div className="fields">
                <Field
                  label="Model ID"
                  name="model"
                  required
                  maxLength={31}
                  pattern="[A-Z0-9][A-Z0-9_-]*"
                  placeholder="KETTLE-01"
                />
                <Field
                  label="Batch ID"
                  name="batch"
                  required
                  maxLength={31}
                  pattern="[A-Z0-9][A-Z0-9_-]*"
                  placeholder="BATCH-2026"
                />
                <Field
                  label="Serial number (private)"
                  name="serial"
                  type="password"
                  autoComplete="off"
                  required
                  minLength={4}
                  maxLength={31}
                />
                <Field
                  label="Purchase date"
                  name="purchase"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>
              <label className="check">
                <input type="checkbox" name="warranty" defaultChecked />
                Warranty eligible
              </label>
              <Button
                type="submit"
                disabled={busy || !r.authorized || r.status !== 'connected'}
              >
                <LockKeyhole />
                Generate and register
              </Button>
            </form>
          )}
          {busy ? <Loading text="Registering commitment..." /> : null}
          <FormError>{error}</FormError>
        </div>
        <aside className="side-note">
          <LockKeyhole size={25} />
          <h3>Your local credential</h3>
          <p>
            The exported JSON contains secrets. Keep it offline and share it
            only with the product owner.
          </p>
          <p>
            The file is not encrypted. Closing this page clears the in-memory
            copy.
          </p>
        </aside>
      </div>
    </div>
  );
}
