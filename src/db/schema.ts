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
	double,
	mysqlEnum,
} from "drizzle-orm/mysql-core"

export const user = mysqlTable("user", {
	email: varchar("email", { length: 100 }).primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	photo: varchar("photo", { length: 2000 }),
	schoolDistrictName: varchar("school_district_name", { length: 100 }),
	schoolName: varchar("school_name", { length: 100 }),
	schoolRole: mysqlEnum("school_role", ["teacher", "student"]),
	superuser: boolean("superuser").notNull().default(false),
	feedbackCost: double("feedback_cost").notNull().default(0),
	followUpCost: double("follow_up_cost").notNull().default(0),
	insightsCost: double("insights_cost").notNull().default(0),
	chatCost: double("chat_cost").notNull().default(0),
	messageBoardCost: double("message_board_cost").notNull().default(0),
	createdAt: timestamp("created_at")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
})

export const school = mysqlTable(
	"school",
	{
		districtName: varchar("district_name", { length: 100 }).notNull(),
		name: varchar("name", { length: 100 }).notNull(),
		teacherEmailDomain: varchar("teacher_email_domain", { length: 100 }),
		studentEmailDomain: varchar("student_email_domain", { length: 100 }),
		maxUserMonthlyCost: double("max_user_monthly_cost")
			.notNull()
			.default(20),
		maxCourseMonthlyCost: double("max_course_monthly_cost")
			.notNull()
			.default(1000),
		createdAt: timestamp("created_at")
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		cpk: primaryKey(table.districtName, table.name),
		teacherEmailDomainIdx: index("teacher_email_domain_idx").on(
			table.teacherEmailDomain
		),
		studentEmailDomainIdx: index("student_email_domain_idx").on(
			table.studentEmailDomain
		),
	})
)

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

export const course = mysqlTable(
	"course",
	{
		id: varchar("id", { length: 100 }).primaryKey(),
		name: text("name").notNull(),
		section: text("section"),
		inviteCode: varchar("invite_code", { length: 7 }),
		syncedUrl: text("synced_url"),
		syncedRefreshToken: text("synced_refresh_token"),
		syncCost: double("sync_cost").notNull().default(0),
		insightsCost: double("insights_cost").notNull().default(0),
		createdAt: timestamp("created_at")
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		inviteCodeIdx: uniqueIndex("invite_code_unique_idx").on(
			table.inviteCode
		),
	})
)

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
		createdAt: timestamp("created_at")
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
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
		shared: boolean("shared").notNull().default(false),
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
