'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, TriangleAlert } from 'lucide-react';
import { useRecall } from '@/providers/recall-provider';
import { Authorization } from '@/features/manufacturer/authorization';
import { campaignSchema, dateSeconds } from '@/lib/validation/campaign';
import { safeError } from '@/lib/midnight/errors';
import { Button } from '@/components/ui/button';
import { Field, FormError, Loading } from '@/components/shared/form';
export function CampaignForm() {
  const r = useRecall();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="wrap">
      <Link className="back" href="/manufacturer">
        <ArrowLeft size={16} />
        Manufacturer
      </Link>
      <div className="page-head">
        <div>
          <h1>Create recall campaign</h1>
          <p className="muted">
            Publish the affected model, batch and safety guidance.
          </p>
        </div>
      </div>
      <Authorization />
      <div className="form-layout">
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            const f = new FormData(e.currentTarget);
            const text = (key: string) => String(f.get(key) ?? '');
            let input;
            try {
              input = campaignSchema.parse({
                id: text('id'),
                title: text('title'),
                manufacturerId: r.data.manufacturerId,
                modelId: text('model'),
                batchId: text('batch'),
                reason: text('reason'),
                opensAt: dateSeconds(text('opens')),
                expiresAt: dateSeconds(text('expires')),
                purchaseFrom: dateSeconds(text('from')),
                purchaseTo: dateSeconds(text('to')) + 86399,
                warrantyRequired: f.get('warranty') === 'on',
                voucherValue: Number(f.get('voucher')),
              });
            } catch {
              setError(
                'Check all fields: expiration must follow opening, and the purchase range must be valid.',
              );
              return;
            }
            setBusy(true);
            try {
              if (!r.gateway) throw new Error();
              await r.gateway.createCampaign(input);
              await r.refresh();
              r.notify('Recall campaign published.');
              router.push('/manufacturer/campaigns/' + input.id);
            } catch (e) {
              setError(safeError(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="fields">
            <Field
              label="Campaign ID"
              name="id"
              required
              pattern="[A-Z0-9][A-Z0-9_-]*"
              maxLength={31}
              placeholder="RECALL-001"
            />
            <Field
              label="Campaign title"
              name="title"
              required
              minLength={3}
              maxLength={100}
            />
            <Field
              label="Model ID"
              name="model"
              required
              pattern="[A-Z0-9][A-Z0-9_-]*"
              maxLength={31}
            />
            <Field
              label="Batch ID"
              name="batch"
              required
              pattern="[A-Z0-9][A-Z0-9_-]*"
              maxLength={31}
            />
            <Field
              label="Opens at (local time)"
              name="opens"
              type="datetime-local"
              required
            />
            <Field
              label="Expires at (local time)"
              name="expires"
              type="datetime-local"
              required
            />
            <Field
              label="Purchased on or after"
              name="from"
              type="date"
              required
            />
            <Field
              label="Purchased on or before"
              name="to"
              type="date"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reason">Safety notice</label>
            <textarea
              id="reason"
              name="reason"
              required
              minLength={5}
              maxLength={280}
              rows={3}
            />
          </div>
          <label className="check">
            <input name="warranty" type="checkbox" />
            Require warranty eligibility
          </label>
          <Field
            label="Planned voucher value (informational only)"
            name="voucher"
            type="number"
            defaultValue={0}
            min={0}
            max={1000000}
            step={1}
            hint="No voucher or payment is issued in Wave 1."
          />
          <FormError>{error}</FormError>
          {busy ? <Loading text="Publishing recall campaign..." /> : null}
          <Button
            type="submit"
            disabled={busy || !r.authorized || r.status !== 'connected'}
          >
            <Plus />
            Publish campaign
          </Button>
        </form>
        <aside className="side-note">
          <TriangleAlert size={25} />
          <h3>Public safety record</h3>
          <p>
            Campaign conditions and notices are public. Do not include customer
            information or product serial numbers.
          </p>
          <p>
            After publication, conditions are immutable. Close the campaign to
            stop further checks.
          </p>
        </aside>
      </div>
    </div>
  );
}
