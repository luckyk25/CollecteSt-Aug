import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
// Inspect tracked content only. Never print matched values.
const files=execFileSync('git',['ls-files','-z']).toString().split('\0').filter(Boolean);
const patterns=[
 ['Telegram token',/\b\d{5,}:[A-Za-z0-9_-]{20,}\b/g],
 ['GitHub token',/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{25,})\b/g],
 ['OpenAI key',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/g],
 ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
 ['AWS key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
 ['Twilio identifier',/\b(?:AC|SK|MG|VA)[0-9a-fA-F]{32}\b/g],
 ['credential in URL',/https?:\/\/[^/\s:@]+:[^/\s@]{8,}@/g]
];
const findings=[];
for(const file of files){
 if(/(^|\/)(?:\.env[^/]*|\.dev\.vars[^/]*|credentials[^/]*\.json|service-account[^/]*\.json)$|\.(?:pem|key|p12|pfx|db|sqlite3?|tar\.gz)$/.test(file))findings.push(`${file}: forbidden private file`);
 let bytes;try{bytes=readFileSync(file);}catch{continue;}
 if(bytes.includes(0))continue;
 const text=bytes.toString('utf8');
 for(const [kind,regex] of patterns)for(const match of text.matchAll(regex)){
  // Fixtures must be visibly synthetic and confined to test modules.
  const fixture=file.endsWith('-checks.mjs')&&(
   kind==='Telegram token'&&/^123456789:x{32}$/.test(match[0])||
   kind==='Twilio identifier'&&/^(?:AC|SK|MG|VA)([a-fA-F0-9])\1{31}$/.test(match[0])
  );
  if(!fixture)findings.push(`${file}: possible ${kind}`);
 }
}
if(findings.length){console.error([...new Set(findings)].join('\n'));process.exitCode=1;}
else console.log(`Secret checks passed for ${files.length} tracked files. Known-pattern scan; also review staged changes.`);
