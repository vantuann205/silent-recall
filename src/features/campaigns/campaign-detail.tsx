'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TriangleAlert, LockKeyhole } from 'lucide-react';
import { useRecall } from '@/providers/recall-provider';
import { campaignStatus } from '@/lib/validation/campaign';
import { safeError } from '@/lib/midnight/errors';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { FormError, Loading } from '@/components/shared/form';
import { Authorization } from '@/features/manufacturer/authorization';
export function CampaignDetail({ id }: { id: string }) {
  const r = useRecall();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const c = r.data.campaigns.find((c) => c.id === id);
  if (r.loading)
    return (
      <div className="wrap">
        <Loading />
      </div>
    );
  if (!c)
    return (
      <div className="wrap">
        <h1>Campaign not found</h1>
        <Link href="/manufacturer">Return to manufacturer</Link>
      </div>
    );
  return (
    <div className="wrap">
      <Link href="/manufacturer" className="back">
        <ArrowLeft size={16} />
        All campaigns
      </Link>
      <div className="page-head">
        <div>
          <h1>{c.title}</h1>
          <p className="muted">
            {c.id} / {c.manufacturerId}
          </p>
        </div>
        <span className={'badge ' + campaignStatus(c)}>
          {campaignStatus(c)}
        </span>
      </div>
      <div className="notice">
        <TriangleAlert />
        <span>{c.reason}</span>
      </div>
      <div className="form-layout">
        <div>
          <dl>
            {[
              ['Model', c.modelId],
              ['Batch', c.batchId],
              ['Opens', new Date(c.opensAt * 1000).toLocaleString('en-GB')],
              ['Expires', new Date(c.expiresAt * 1000).toLocaleString('en-GB')],
              [
                'Purchase window',
                new Date(c.purchaseFrom * 1000).toLocaleDateString('en-GB') +
                  ' - ' +
                  new Date(c.purchaseTo * 1000).toLocaleDateString('en-GB'),
              ],
              ['Warranty required', c.warrantyRequired ? 'Yes' : 'No'],
              [
                'Planned voucher value',
                c.voucherValue + ' (informational only)',
              ],
            ].map(([label, value]) => (
              <div className="keyline" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Authorization />
          <div className="actions">
            <Link
              className={buttonVariants({ variant: 'outline' })}
              href={'/customer/check?campaign=' + encodeURIComponent(c.id)}
            >
              Check eligibility
            </Link>
            {c.active ? (
              <Button
                variant="destructive"
                disabled={!r.authorized || r.status !== 'connected' || busy}
                onClick={() => setOpen(true)}
              >
                Close campaign
              </Button>
            ) : null}
          </div>
          <FormError>{error}</FormError>
        </div>
        <aside className="side-note">
          <LockKeyhole size={25} />
          <h3>Eligibility is not a claim</h3>
          <p>
            A successful check proves the recall conditions. It does not issue
            compensation or reserve a payment.
          </p>
        </aside>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Close this campaign?</AlertDialogTitle>
          <AlertDialogDescription>
            Further eligibility checks will be rejected. The public recall
            record is preserved. This action cannot be reversed.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep open</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await r.gateway!.closeCampaign(c.id);
                  await r.refresh();
                  setOpen(false);
                  r.notify('Campaign closed.');
                } catch (e) {
                  setError(safeError(e));
                  setOpen(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Closing...' : 'Confirm close'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
