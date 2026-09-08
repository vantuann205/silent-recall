import {afterEach,expect,it,vi} from 'vitest';
import {getConfig,demoAllowed} from './config';
afterEach(()=>vi.unstubAllEnvs());
it('has isolated local endpoints',()=>expect(getConfig().network).toBe('undeployed'));
it('rejects unsafe networks and malformed addresses',()=>{vi.stubEnv('NEXT_PUBLIC_MIDNIGHT_NETWORK','mainnet');expect(getConfig).toThrow();});
it('cannot enable simulation in production',()=>{vi.stubEnv('NODE_ENV','production');vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO','true');expect(demoAllowed()).toBe(false);});
