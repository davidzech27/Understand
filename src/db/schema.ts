import { sql } from "drizzle-orm";
import {
	mysqlTable,
	varchar,
	primaryKey,
	datetime,
	text,
} from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
	email: varchar("email", { length: 100 }).primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
});

export const feedbackConfig = mysqlTable(
	"feedback_config",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		assignmentId: varchar("assignment_id", { length: 100 }).notNull(),
		instructions: text("instructions").notNull(),
	},
	(table) => ({
		cpk: primaryKey(table.courseId, table.assignmentId),
	})
);

export const feedback = mysqlTable(
	"feedback",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		assignmentId: varchar("assignment_id", { length: 100 }).notNull(),
		userEmail: varchar("user_email", { length: 100 }).notNull(),
		submission: text("submission").notNull(),
		feedback: text("feedback").notNull(),
		givenAt: datetime("given_at").default(sql`now()`),
	},
	(table) => ({
		cpk: primaryKey(
			table.courseId,
			table.assignmentId,
			table.userEmail,
			table.givenAt
		),
	})
);
