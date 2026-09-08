'use client';
import { useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useRecall } from '@/providers/recall-provider';
import { Button } from '@/components/ui/button';
import { Field, FormError } from '@/components/shared/form';
import { safeError } from '@/lib/midnight/errors';
export function Authorization() {
  const r = useRecall();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (r.authorized && r.status === 'connected')
    return (
      <div className="notice success">
        <ShieldCheck />
        <span>Manufacturer authorized / {r.data.manufacturerId}</span>
      </div>
    );
  return (
    <section className="notice">
      <LockKeyhole />
      <div style={{ width: '100%' }}>
        <h3>Manufacturer authorization</h3>
        <p>
          Connect your wallet and unlock the deployment-bound manufacturer
          authority.
        </p>
        <form
          className="actions"
          style={{ marginTop: 12 }}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            const form = e.currentTarget;
            const key = String(new FormData(form).get('authority') ?? '');
            try {
              await r.authorize(
                r.gateway?.mode === 'demo' ? '07'.repeat(32) : key,
              );
              form.reset();
            } catch (err) {
              setError(safeError(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          {r.gateway?.mode !== 'demo' ? (
            <Field
              label="Manufacturer authority key"
              name="authority"
              type="password"
              autoComplete="off"
              required
              minLength={64}
              maxLength={64}
            />
          ) : null}
          <Button disabled={busy || r.status !== 'connected'} type="submit">
            <ShieldCheck />
            {busy
              ? 'Authorizing...'
              : r.gateway?.mode === 'demo'
                ? 'Authorize local issuer'
                : 'Authorize manufacturer'}
          </Button>
          <FormError>{error}</FormError>
        </form>
      </div>
    </section>
  );
}
