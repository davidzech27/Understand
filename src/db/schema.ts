import { mysqlTable, varchar, primaryKey } from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
	email: varchar("email", { length: 100 }).primaryKey(),
	name: varchar("name", { length: 100 }).notNull(), // todo - make sure this column is being used when roster is fetched
	googleRefreshToken: varchar("google_refresh_token", {
		length: 1000,
	}).notNull(),
});

export const feedbackConfig = mysqlTable(
	"feedback_config",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		assignmentId: varchar("assignment_id", { length: 100 }).notNull(),
		instructions: varchar("instructions", { length: 10000 }).notNull(),
	},
	(table) => ({
		cpk: primaryKey(table.courseId, table.assignmentId),
	})
);
