CREATE TABLE `tool` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`license` text,
	`company` text,
	`usage_restrictions` text,
	`risk_analysis` text,
	`alternative_solutions` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tool_name_unique` ON `tool` (`name`);