import {expect,it} from 'vitest';
import {mapWalletStatus} from './connect';
it('distinguishes disconnected and incorrect networks',()=>{expect(mapWalletStatus({status:'disconnected'},'undeployed')).toBe('disconnected');expect(mapWalletStatus({status:'connected',networkId:'preview'},'undeployed')).toBe('wrong-network');expect(mapWalletStatus({status:'connected',networkId:'undeployed'},'undeployed')).toBe('connected');});
