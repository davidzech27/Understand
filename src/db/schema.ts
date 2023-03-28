import { mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
	email: varchar("email", { length: 100 }).primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	googleRefreshToken: varchar("google_refresh_token", {
		length: 1000,
	}).notNull(),
});
