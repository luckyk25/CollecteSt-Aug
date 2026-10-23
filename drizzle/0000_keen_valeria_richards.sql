CREATE TABLE `sms_challenges` (
	`user_id` text PRIMARY KEY NOT NULL,
	`challenge_id` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`street_id` text NOT NULL,
	`sector` integer NOT NULL,
	`types` text NOT NULL,
	`consent_at` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sms_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`collection_date` text NOT NULL,
	`status` text NOT NULL,
	`provider_sid` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `delivery_once` ON `sms_deliveries` (`user_id`,`collection_date`);--> statement-breakpoint
CREATE TABLE `sms_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`count` integer NOT NULL,
	`last_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sms_subscriptions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
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
CREATE UNIQUE INDEX `subscription_phone_unique` ON `sms_subscriptions` (`phone`);