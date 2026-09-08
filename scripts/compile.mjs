import {spawnSync} from 'node:child_process';
import {mkdirSync,cpSync} from 'node:fs';
const args=['compile','+0.31.1',...(process.argv.includes('--fast')?['--skip-zk']:[]),'contract/src/silent-recall.compact','contract/generated'];
const result=process.platform==='win32'?spawnSync('wsl',['-d','Ubuntu','--','bash','-lc',`cd '${process.cwd().replaceAll('\\','/').replace(/^([A-Z]):/i,(_,d)=>'/mnt/'+d.toLowerCase())}' && compact ${args.join(' ')}`],{stdio:'inherit'}):spawnSync('compact',args,{stdio:'inherit'});
if(result.status!==0)process.exit(result.status??1);
mkdirSync('public/zk',{recursive:true});
cpSync('contract/generated','public/zk',{recursive:true});
