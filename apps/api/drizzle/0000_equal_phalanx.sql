CREATE TABLE `cats` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`birth_date` text,
	`breed` text,
	`weight` real,
	`image_url` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_cats_user_id` ON `cats` (`user_id`);--> statement-breakpoint
CREATE TABLE `toilet_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`cat_id` text NOT NULL,
	`type` text NOT NULL,
	`timestamp` text NOT NULL,
	`note` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`cat_id`) REFERENCES `cats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_toilet_logs_cat_id` ON `toilet_logs` (`cat_id`);--> statement-breakpoint
CREATE INDEX `idx_toilet_logs_timestamp` ON `toilet_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_toilet_logs_cat_timestamp` ON `toilet_logs` (`cat_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`clerk_id` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_id_unique` ON `users` (`clerk_id`);