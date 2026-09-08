'use client';
import {useRecall} from '@/providers/recall-provider';
import {CredentialImport} from '@/features/credentials/credential-import';
import {CampaignList} from '@/features/campaigns/campaign-list';
import {PrivacyBoundary} from '@/components/shared/shell';
import {Loading} from '@/components/shared/form';
export default function Customer(){const r=useRecall();return <div className="wrap"><div className="page-head"><div><h1>Customer workspace</h1><p className="muted">Find your recall. Keep your product details private.</p></div></div><div className="workspace"><CredentialImport/><div>{r.loading?<Loading/>:<CampaignList campaigns={r.data.campaigns} customer/>}</div></div><PrivacyBoundary/></div>;}
