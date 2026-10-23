declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

declare namespace Cloudflare {
 interface Env {
  SMS_ENABLED?: string;
  SMS_SCHEDULER_READY?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_VERIFY_SERVICE_SID?: string;
  TWILIO_MESSAGING_SERVICE_SID?: string;
  TELEGRAM_ENABLED?: string;
  TELEGRAM_SCHEDULER_READY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
 }
}
