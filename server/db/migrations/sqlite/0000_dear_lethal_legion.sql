CREATE TABLE `budget_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_settings_key_unique` ON `budget_settings` (`key`);--> statement-breakpoint
CREATE TABLE `recurring_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`amount` real NOT NULL,
	`category` text NOT NULL,
	`day_of_month` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
