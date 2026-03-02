CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`date` text NOT NULL,
	`recurring_entry_id` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`recurring_entry_id`) REFERENCES `recurring_entries`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
DROP TABLE `envelope_expenses`;--> statement-breakpoint
DROP TABLE `monthly_actuals`;