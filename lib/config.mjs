import {MINUTE_MS,DAY_MS} from '../public/config.mjs';
export const TELEGRAM=Object.freeze({tokenBytes:32,requestTimeoutMs:15_000,leaseMs:2*MINUTE_MS,pollBudgetMs:45_000,updatesPerPage:50,maxPollPages:5,maxSendsPerRun:8,testCooldownMs:MINUTE_MS,receiptLifetimeMs:7*DAY_MS,webhookHealthMs:15*MINUTE_MS,webhookCheckMs:5*MINUTE_MS});
export const API=Object.freeze({maxBodyBytes:4_096,maxWebhookBytes:32_768,subscriptionIdPattern:/^[a-f0-9-]{36}$/});
export const RATE_LIMITS=Object.freeze({link:[30,200],test:[10,200],subscription:[60,1000],status:[1200,20000],address:[200,10000],location:[30,200]});
