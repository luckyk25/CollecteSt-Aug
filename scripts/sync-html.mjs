import {writeFileSync} from 'node:fs';
import {renderHtml} from './render-html.mjs';
writeFileSync('app/page-html.ts','export default '+JSON.stringify(renderHtml())+';\n');
