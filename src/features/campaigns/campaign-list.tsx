'use client';
import Link from 'next/link';
import { FileCheck2, ArrowUpRight, Plus, IdCard } from 'lucide-react';
import { campaignStatus, type Campaign } from '@/lib/validation/campaign';
import { buttonVariants } from '@/components/ui/button';
export function CampaignList({
  campaigns,
  customer = false,
}: {
  campaigns: Campaign[];
  customer?: boolean;
}) {
  return (
    <>
      <div className="section-head">
        <div>
          <h2>Recall campaigns</h2>
          <p className="muted">Public safety conditions and current status.</p>
        </div>
        {!customer ? (
          <div className="actions">
            <Link
              className={buttonVariants({ variant: 'outline' })}
              href="/manufacturer/products/new"
            >
              <IdCard />
              Issue credential
            </Link>
            <Link
              className={buttonVariants()}
              href="/manufacturer/campaigns/new"
            >
              <Plus />
              Create campaign
            </Link>
          </div>
        ) : null}
      </div>
      {campaigns.length ? (
        <div className="table-scroll">
          <table className="campaign-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Batch</th>
                <th>Status</th>
                <th>Closes</th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.title}</strong>
                    <small>
                      {c.id} / {c.modelId}
                    </small>
                  </td>
                  <td>{c.batchId}</td>
                  <td>
                    <span className={'badge ' + campaignStatus(c)}>
                      {campaignStatus(c)}
                    </span>
                  </td>
                  <td>
                    {new Date(c.expiresAt * 1000).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <Link
                      className="row-action"
                      title={(customer ? 'Check ' : 'View ') + c.title}
                      aria-label={(customer ? 'Check ' : 'View ') + c.title}
                      href={
                        customer
                          ? '/customer/check?campaign=' +
                            encodeURIComponent(c.id)
                          : '/manufacturer/campaigns/' +
                            encodeURIComponent(c.id)
                      }
                    >
                      <ArrowUpRight size={19} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <FileCheck2 size={38} />
          <h3>No recall campaigns yet</h3>
          <p className="muted">Published recall campaigns will appear here.</p>
          {!customer ? (
            <Link
              className={buttonVariants()}
              href="/manufacturer/campaigns/new"
            >
              <Plus />
              Create campaign
            </Link>
          ) : null}
        </div>
      )}
    </>
  );
}
