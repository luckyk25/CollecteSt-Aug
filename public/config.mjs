// Shared product settings. This module contains no credentials.
export const LOCALE='fr-CA';
export const TIME_ZONE='America/Toronto';
export const MINUTE_MS=60_000;
export const HOUR_MS=60*MINUTE_MS;
export const DAY_MS=24*HOUR_MS;
export const ADDRESS=Object.freeze({placeholder:'123 rue Exemple',minLength:3,maxLength:160,legacyStorageKeys:Object.freeze(['ma-collecte-vsad-v1','ma-collecte-vsad-v2'])});
export const LOCATION=Object.freeze({timeoutMs:15_000,maximumAgeMs:0,maxAccuracyMetres:150,maxStreetDistanceMetres:100,longitudeMetresPerDegree:76_300,latitudeMetresPerDegree:111_200});
export const REMINDERS=Object.freeze({defaultTime:'18:00',deliveryWindowMinutes:5,stepSeconds:60,inviteMinutes:20,maxFamilyAccounts:10,pollIntervalMs:5_000});
export const COLLECTION_HOURS=Object.freeze({start:7,end:19});
export const UI=Object.freeze({upcomingDateCount:6,refreshIntervalMs:MINUTE_MS,downloadUrlLifetimeMs:1_000});
export function validReminderTime(value){return typeof value==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);}
export function reminderMinutes(value){if(!validReminderTime(value))throw new RangeError('Invalid reminder time.');const [hour,minute]=value.split(':').map(Number);return hour*60+minute;}
export function formatReminderTime(value=REMINDERS.defaultTime){const [hour,minute]=value.split(':');return `${Number(hour)} h${minute==='00'?'':' '+minute}`;}
