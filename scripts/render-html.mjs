import {readFileSync} from 'node:fs';
import {ADDRESS,REMINDERS,formatReminderTime} from '../public/config.mjs';
const values={DEFAULT_REMINDER_LABEL:formatReminderTime(REMINDERS.defaultTime),ADDRESS_PLACEHOLDER:ADDRESS.placeholder,ADDRESS_MIN_LENGTH:ADDRESS.minLength,ADDRESS_MAX_LENGTH:ADDRESS.maxLength,REMINDER_DEFAULT_TIME:REMINDERS.defaultTime,REMINDER_STEP_SECONDS:REMINDERS.stepSeconds,INVITE_MINUTES:REMINDERS.inviteMinutes};
export function renderHtml(){return readFileSync(new URL('../page.html',import.meta.url),'utf8').replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{if(!(key in values))throw new Error('Unknown page setting: '+key);return String(values[key]).replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));});}
