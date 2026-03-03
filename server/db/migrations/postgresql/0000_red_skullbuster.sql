CREATE TABLE "recurring_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"amount" real NOT NULL,
	"category" text,
	"day_of_month" integer,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"amount" real NOT NULL,
	"type" text NOT NULL,
	"date" text NOT NULL,
	"recurring_entry_id" integer,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_entry_id_recurring_entries_id_fk" FOREIGN KEY ("recurring_entry_id") REFERENCES "public"."recurring_entries"("id") ON DELETE set null ON UPDATE no action;