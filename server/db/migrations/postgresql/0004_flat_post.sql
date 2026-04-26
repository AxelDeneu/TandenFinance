CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"type" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recurring_entries" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "recurring_entries" ADD CONSTRAINT "recurring_entries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "categories" ("name", "icon", "color", "type", "sort_order", "created_at", "updated_at") VALUES
	('Salaire',     'i-lucide-briefcase',     '#4ADE80', 'income',  10, now(), now()),
	('Freelance',   'i-lucide-laptop',        '#22D3EE', 'income',  20, now(), now()),
	('Aides sociales', 'i-lucide-hand-helping', '#FBBF24', 'income', 30, now(), now()),
	('Investissements', 'i-lucide-trending-up', '#1FB578', 'income', 40, now(), now()),
	('Primes',      'i-lucide-sparkles',      '#4ADE80', 'income',  50, now(), now()),
	('Remboursements', 'i-lucide-undo-2',     '#22D3EE', 'income',  60, now(), now()),
	('Vente',       'i-lucide-tag',           '#FBBF24', 'income',  70, now(), now()),
	('Courses',     'i-lucide-shopping-cart', '#1FB578', 'expense', 110, now(), now()),
	('Transport',   'i-lucide-fuel',          '#22D3EE', 'expense', 120, now(), now()),
	('Loisirs',     'i-lucide-play',          '#F6946A', 'expense', 130, now(), now()),
	('Énergie',     'i-lucide-zap',           '#FBBF24', 'expense', 140, now(), now()),
	('Restaurants', 'i-lucide-coffee',        '#F87171', 'expense', 150, now(), now()),
	('Abonnements', 'i-lucide-credit-card',   '#A78BFA', 'expense', 160, now(), now()),
	('Logement',    'i-lucide-home',          '#60A5FA', 'expense', 170, now(), now()),
	('Loyer',       'i-lucide-home',          '#60A5FA', 'expense', 175, now(), now()),
	('Charges',     'i-lucide-receipt',       '#FBBF24', 'expense', 180, now(), now()),
	('Eau',         'i-lucide-droplets',      '#22D3EE', 'expense', 185, now(), now()),
	('Télécom',     'i-lucide-wifi',          '#A78BFA', 'expense', 190, now(), now()),
	('Alimentation','i-lucide-shopping-cart', '#1FB578', 'expense', 195, now(), now()),
	('Restaurant',  'i-lucide-coffee',        '#F87171', 'expense', 200, now(), now()),
	('Santé',       'i-lucide-heart',         '#F472B6', 'expense', 210, now(), now()),
	('Pharmacie',   'i-lucide-heart',         '#F472B6', 'expense', 215, now(), now()),
	('Enfants',     'i-lucide-baby',          '#FB923C', 'expense', 220, now(), now()),
	('Habillement', 'i-lucide-shirt',         '#A78BFA', 'expense', 230, now(), now()),
	('Éducation',   'i-lucide-graduation-cap','#FBBF24', 'expense', 240, now(), now()),
	('Cadeaux',     'i-lucide-gift',          '#FB923C', 'expense', 250, now(), now()),
	('Épargne',     'i-lucide-piggy-bank',    '#1FB578', 'expense', 260, now(), now()),
	('Impôts',      'i-lucide-landmark',      '#F87171', 'expense', 270, now(), now()),
	('Dettes',      'i-lucide-credit-card',   '#F87171', 'expense', 280, now(), now()),
	('Assurances',  'i-lucide-shield',        '#A5ADBE', 'expense', 290, now(), now()),
	('Frais bancaires', 'i-lucide-banknote',  '#A5ADBE', 'expense', 300, now(), now()),
	('Animaux',     'i-lucide-dog',           '#FB923C', 'expense', 310, now(), now()),
	('Imprévus',    'i-lucide-sparkles',      '#A78BFA', 'expense', 320, now(), now()),
	('Carburant',   'i-lucide-fuel',          '#22D3EE', 'expense', 330, now(), now()),
	('Divers',      'i-lucide-tag',           '#A5ADBE', 'expense', 900, now(), now()),
	('Autre',       'i-lucide-tag',           '#6B7489', 'expense', 999, now(), now());
--> statement-breakpoint
UPDATE "recurring_entries"
   SET "category_id" = (SELECT "id" FROM "categories"
                        WHERE LOWER("categories"."name") = LOWER("recurring_entries"."category")
                        LIMIT 1)
 WHERE "category" IS NOT NULL AND "category_id" IS NULL;
--> statement-breakpoint
UPDATE "recurring_entries"
   SET "category_id" = (SELECT "id" FROM "categories"
                        WHERE LOWER("categories"."name") = LOWER("recurring_entries"."label")
                        LIMIT 1)
 WHERE "category_id" IS NULL;
--> statement-breakpoint
UPDATE "recurring_entries"
   SET "category_id" = (SELECT "id" FROM "categories" WHERE "name" = 'Autre' LIMIT 1)
 WHERE "category_id" IS NULL;
