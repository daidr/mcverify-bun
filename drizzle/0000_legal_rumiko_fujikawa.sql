CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hduhelp_id` text NOT NULL,
	`uuid_mojang` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_unique` ON `users` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_hduhelpId_unique` ON `users` (`hduhelp_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_uuidMojang_unique` ON `users` (`uuid_mojang`);--> statement-breakpoint
CREATE UNIQUE INDEX `hduhelp_id_idx` ON `users` (`hduhelp_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uuid_mojang_idx` ON `users` (`uuid_mojang`);