CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`seller` text NOT NULL,
	`quantity` integer NOT NULL,
	`date` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL
);
