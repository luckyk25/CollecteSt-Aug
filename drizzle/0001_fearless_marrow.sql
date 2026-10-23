CREATE TABLE `telegram_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_id` text NOT NULL,
	`collection_date` text NOT NULL,
	`status` text NOT NULL,
	`message_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_delivery_once` ON `telegram_deliveries` (`recipient_id`,`collection_date`);--> statement-breakpoint
CREATE TABLE `telegram_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`address` text NOT NULL,
	`street_id` text NOT NULL,
	`sector` integer NOT NULL,
	`types` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_invite_token_unique` ON `telegram_invites` (`token_hash`);--> statement-breakpoint
CREATE TABLE `telegram_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`until_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `telegram_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`chat_id` text NOT NULL,
	`display_name` text NOT NULL,
	`username` text NOT NULL,
	`address` text NOT NULL,
	`street_id` text NOT NULL,
	`sector` integer NOT NULL,
	`types` text NOT NULL,
	`consent_at` text NOT NULL,
	`consent_version` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_chat_unique` ON `telegram_subscriptions` (`chat_id`);