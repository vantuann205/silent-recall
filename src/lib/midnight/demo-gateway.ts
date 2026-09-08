import {CostModel,QueryContext,createConstructorContext,sampleContractAddress} from '@midnight-ntwrk/compact-runtime';
import {Contract,ledger,pureCircuits} from '../../../contract/generated/contract/index.js';
import {demoAllowed} from '../config/config';
import {text32,hex32} from '../crypto/encoding';
import {encodeOpening} from '../crypto/commitment';
import {encodeCampaign,publicSnapshot} from './mapping';
import {witnesses,type PrivateState} from './private-state';
import type {RecallGateway} from './gateway';
import {RecallError} from './errors';
export const DEMO_AUTHORITY='07'.repeat(32);
export function demoGateway():RecallGateway{if(!demoAllowed())throw new RecallError('UNAVAILABLE');const contract=new Contract<PrivateState>(witnesses);const initial=contract.initialState(createConstructorContext<PrivateState>({},'0'.repeat(64)),pureCircuits.authorityHash(hex32(DEMO_AUTHORITY)),text32('ACME'));let context={currentPrivateState:initial.currentPrivateState,currentZswapLocalState:initial.currentZswapLocalState,costModel:CostModel.initialCostModel(),currentQueryContext:new QueryContext(initial.currentContractState.data,sampleContractAddress())};
 return{mode:'demo',async snapshot(){return publicSnapshot(ledger(context.currentQueryContext.state));},async authorize(secret){context.currentPrivateState.authoritySecret=hex32(secret);if(!ledger(context.currentQueryContext.state).initialized)context=contract.impureCircuits.initializeManufacturer(context).context;else if(secret!==DEMO_AUTHORITY)throw new RecallError('UNAUTHORIZED');},async register(commitment){context=contract.impureCircuits.registerProductCommitment(context,hex32(commitment)).context;},async createCampaign(input){context=contract.impureCircuits.createRecallCampaign(context,text32(input.id),encodeCampaign(input)).context;},async closeCampaign(id){context=contract.impureCircuits.closeRecallCampaign(context,text32(id)).context;},async prove(id,credential){context.currentPrivateState.opening=encodeOpening(credential);context.currentQueryContext.block={...context.currentQueryContext.block,secondsSinceEpoch:BigInt(Math.floor(Date.now()/1000))};try{context=contract.impureCircuits.proveRecallEligibility(context,text32(id)).context;}finally{delete context.currentPrivateState.opening;}},async disconnect(){context.currentPrivateState={};}};
}
