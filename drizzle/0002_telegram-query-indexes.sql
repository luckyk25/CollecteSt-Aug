CREATE INDEX `telegram_invite_owner` ON `telegram_invites` (`owner_id`);--> statement-breakpoint
CREATE INDEX `telegram_invite_expiry` ON `telegram_invites` (`expires_at`);--> statement-breakpoint
CREATE INDEX `telegram_subscription_owner_created` ON `telegram_subscriptions` (`owner_id`,`created_at`);