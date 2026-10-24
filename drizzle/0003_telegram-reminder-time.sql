ALTER TABLE `telegram_invites` ADD `reminder_time` text DEFAULT '18:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_subscriptions` ADD `reminder_time` text DEFAULT '18:00' NOT NULL;