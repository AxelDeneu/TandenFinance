CREATE TABLE `envelope_expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recurring_entry_id` integer NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`label` text NOT NULL,
	`amount` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`recurring_entry_id`) REFERENCES `recurring_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
