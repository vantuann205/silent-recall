'use client';
import { TriangleAlert } from 'lucide-react';
import { useRecall } from '@/providers/recall-provider';
import { Authorization } from '@/features/manufacturer/authorization';
import { CampaignList } from '@/features/campaigns/campaign-list';
import { PrivacyBoundary } from '@/components/shared/shell';
import { Loading } from '@/components/shared/form';
export default function Manufacturer() {
  const r = useRecall();
  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <h1>Manufacturer workspace</h1>
          <p className="muted">
            Manage private product credentials and public safety recalls.
          </p>
        </div>
      </div>
      <div className="notice">
        <TriangleAlert />
        <span>
          Affected product? Publish clear safety guidance before requesting
          eligibility checks.
        </span>
      </div>
      <div className="stats">
        {[
          [
            'Registered products',
            r.data.products,
            'Hiding commitments on record',
          ],
          [
            'Recall campaigns',
            r.data.campaigns.length,
            'All published campaigns',
          ],
          [
            'Verifications',
            r.data.verifications,
            'Successful checks, not unique people',
          ],
        ].map(([label, count, hint]) => (
          <div className="stat" key={label}>
            <div>{label}</div>
            <strong>{count}</strong>
            <span>{hint}</span>
          </div>
        ))}
      </div>
      <Authorization />
      {r.loading ? <Loading /> : <CampaignList campaigns={r.data.campaigns} />}
      <PrivacyBoundary />
    </div>
  );
}
