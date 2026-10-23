import {readFileSync,writeFileSync} from 'node:fs';
writeFileSync('app/page-html.ts','export default '+JSON.stringify(readFileSync('page.html','utf8'))+';\n');
