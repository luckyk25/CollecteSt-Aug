import {copyFileSync,constants} from 'node:fs';
const target=new URL('../.openai/hosting.json',import.meta.url);
const template=new URL('../.openai/hosting.example.json',import.meta.url);
// A fresh clone starts without a live Site binding. Never replace an existing one.
try{copyFileSync(template,target,constants.COPYFILE_EXCL);}catch(error){if(error.code!=='EEXIST')throw error;}
