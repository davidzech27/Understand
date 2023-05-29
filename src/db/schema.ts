import {
	mysqlTable,
	varchar,
	primaryKey,
	datetime,
	int,
	text,
	json,
	uniqueIndex,
} from "drizzle-orm/mysql-core"

export const user = mysqlTable("user", {
	email: varchar("email", { length: 100 }).primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	photo: varchar("photo", { length: 2000 }),
})

export const teacherToCourse = mysqlTable(
	"teacher_to_course",
	{
		teacherEmail: varchar("teacher_email", { length: 100 }).notNull(),
		courseId: varchar("course_id", { length: 100 }).notNull(),
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
	linkedUrl: text("linked_url"),
	linkedAccessToken: text("linked_access_token"),
	linkedRefreshToken: text("linked_refresh_token"),
})

export const assignment = mysqlTable(
	"assignment",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		assignmentId: varchar("assignment_id", { length: 100 }).notNull(),
		title: text("title").notNull(),
		description: text("description"),
		instructions: text("instructions"),
		context: text("context"),
		dueAt: datetime("due_at"),
		linkedUrl: text("linked_url"),
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
		givenAt: datetime("given_at").notNull(),
		submission: text("submission").notNull(),
		rawResponse: text("raw_response").notNull(),
		metadata: json("metadata").notNull(),
	},
	(table) => ({
		cpk: primaryKey(
			table.courseId,
			table.assignmentId,
			table.userEmail,
			table.givenAt
		),
	})
)

export const followUp = mysqlTable(
	"follow_up",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		assignmentId: varchar("assignment_id", { length: 100 }).notNull(),
		userEmail: varchar("user_email", { length: 100 }).notNull(),
		feedbackGivenAt: datetime("feedback_given_at").notNull(),
		givenAt: datetime("given_at").notNull(),
		paragraphNumber: int("paragraph_number"),
		sentenceNumber: int("sentence_number"),
		query: text("query").notNull(),
		rawResponse: text("raw_response").notNull(),
		metadata: json("metadata").notNull(),
	},
	(table) => ({
		cpk: primaryKey(
			table.courseId,
			table.assignmentId,
			table.userEmail,
			table.feedbackGivenAt,
			table.givenAt
		),
	})
)
