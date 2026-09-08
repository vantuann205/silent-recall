import {Suspense} from 'react';
import {ProofFlow} from '@/features/eligibility/proof-flow';
import {Loading} from '@/components/shared/form';
export default function Page(){return <Suspense fallback={<Loading/>}><ProofFlow/></Suspense>;}
