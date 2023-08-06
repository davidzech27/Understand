import { sql } from "drizzle-orm"
import {
	mysqlTable,
	varchar,
	primaryKey,
	timestamp,
	text,
	json,
	uniqueIndex,
	boolean,
	index,
} from "drizzle-orm/mysql-core"

export const user = mysqlTable("user", {
	email: varchar("email", { length: 100 }).primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	photo: varchar("photo", { length: 2000 }),
	createdAt: timestamp("created_at")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	superuser: boolean("superuser").notNull().default(false),
})

export const teacherToCourse = mysqlTable(
	"teacher_to_course",
	{
		teacherEmail: varchar("teacher_email", { length: 100 }).notNull(),
		courseId: varchar("course_id", { length: 100 }).notNull(),
		syncedAt: timestamp("synced_at").default(sql`NULL`),
	},
	(table) => ({
		cpk: primaryKey(table.teacherEmail, table.courseId),
		idx: uniqueIndex("course_id_teacher_email_unique_idx").on(
			table.courseId,
			table.teacherEmail
		),
	})
)

export const studentToCourse = mysqlTable(
	"student_to_course",
	{
		studentEmail: varchar("student_email", { length: 100 }).notNull(),
		courseId: varchar("course_id", { length: 100 }).notNull(),
		syncedAt: timestamp("synced_at").default(sql`NULL`),
	},
	(table) => ({
		cpk: primaryKey(table.studentEmail, table.courseId),
		idx: uniqueIndex("course_id_student_email_unique_idx").on(
			table.courseId,
			table.studentEmail
		),
	})
)

export const course = mysqlTable("course", {
	id: varchar("id", { length: 100 }).primaryKey(),
	name: text("name").notNull(),
	section: text("section"),
	syncedUrl: text("synced_url"),
	syncedRefreshToken: text("synced_refresh_token"),
})

export const assignment = mysqlTable(
	"assignment",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		assignmentId: varchar("assignment_id", { length: 100 }).notNull(),
		title: text("title").notNull(),
		description: text("description"),
		instructions: text("instructions"),
		dueAt: timestamp("due_at").default(sql`NULL`),
		syncedUrl: text("synced_url"),
		syncedAt: timestamp("synced_at").default(sql`NULL`),
	},
	(table) => ({
		cpk: primaryKey(table.courseId, table.assignmentId),
	})
)

export const feedback = mysqlTable(
	"feedback",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		assignmentId: varchar("assignment_id", { length: 100 }).notNull(),
		userEmail: varchar("user_email", { length: 100 }).notNull(),
		givenAt: timestamp("given_at").notNull(),
		submissionHTML: text("submission_html").notNull(),
		unrevisedSubmissionHTML: text("unrevised_submission_html").notNull(),
		list: json("list").notNull(),
		rawResponse: text("raw_response").notNull(),
		insights: json("insights"),
		syncedInsightsAt: timestamp("synced_insights_at").default(sql`NULL`),
	},
	(table) => ({
		cpk: primaryKey(
			table.courseId,
			table.assignmentId,
			table.userEmail,
			table.givenAt
		),
		idx: index("course_id_given_at_idx").on(table.courseId, table.givenAt),
		courseIdStudentEmailSyncedIdx: index(
			"course_id_user_email_synced_insights_at_idx"
		).on(table.courseId, table.userEmail, table.syncedInsightsAt),
		courseIdAssignmentIdSyncedIdx: index(
			"course_id_assignment_id_synced_insights_at_idx"
		).on(table.courseId, table.assignmentId, table.syncedInsightsAt),
	})
)

export const studentInsight = mysqlTable(
	"student_insight",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		studentEmail: varchar("student_email", { length: 100 }).notNull(),
		insights: json("insights").notNull(),
		syncedAt: timestamp("synced_at")
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		cpk: primaryKey(table.courseId, table.studentEmail),
	})
)

export const assignmentInsight = mysqlTable(
	"assignment_insight",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		assignmentId: varchar("assignment_id", { length: 100 }).notNull(),
		insights: json("insights").notNull(),
		syncedAt: timestamp("synced_at")
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		cpk: primaryKey(table.courseId, table.assignmentId),
	})
)
