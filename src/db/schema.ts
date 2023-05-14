import { sql } from "drizzle-orm"
import {
	mysqlTable,
	varchar,
	primaryKey,
	datetime,
	text,
	uniqueIndex,
	json,
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
})

export const assignment = mysqlTable(
	"assignment",
	{
		courseId: varchar("course_id", { length: 100 }).notNull(),
		assignmentId: varchar("assignment_id", { length: 100 }).notNull(),
		title: text("title").notNull(),
		instructions: text("instructions").notNull(),
		studentDescription: text("student_description"),
		dueAt: datetime("due_at"),
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
		rawFeedback: text("raw_feedback").notNull(),
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

// ! about to be dropped
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
)
