CREATE TABLE `monthly_actuals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recurring_entry_id` integer NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`actual_amount` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`recurring_entry_id`) REFERENCES `recurring_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_actuals_entry_year_month_idx` ON `monthly_actuals` (`recurring_entry_id`,`year`,`month`);--> statement-breakpoint
DROP TABLE `budget_settings`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_recurring_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`amount` real NOT NULL,
	`category` text,
	`day_of_month` integer,
	`active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_recurring_entries`("id", "type", "label", "amount", "category", "day_of_month", "active", "notes", "created_at", "updated_at") SELECT "id", "type", "label", "amount", "category", "day_of_month", "active", "notes", "created_at", "updated_at" FROM `recurring_entries`;--> statement-breakpoint
DROP TABLE `recurring_entries`;--> statement-breakpoint
ALTER TABLE `__new_recurring_entries` RENAME TO `recurring_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;