import { desc, and, eq, or, gt, isNull, isNotNull, sql } from "drizzle-orm"
import { z } from "zod"

import db from "~/db/db"
import {
	user,
	course,
	studentToCourse,
	teacherToCourse,
	studentInsight,
	feedback,
	assignment,
} from "~/db/schema"
import { feedbackListSchema, feedbackInsightsSchema } from "./Feedback"

const studentInsightsSchema = z
	.object({
		type: z.string(),
		content: z.string(),
		sources: z
			.object({
				assignmentId: z.string(),
				paragraphs: z.number().array(),
			})
			.array(),
	})
	.array()

type StudentInsights = z.infer<typeof studentInsightsSchema>

export type User = Exclude<
	Awaited<ReturnType<ReturnType<typeof User>["get"]>>,
	undefined
>

const User = ({ email }: { email: string }) => ({
	create: async ({
		name,
		photo,
	}: {
		name: string
		photo: string | undefined
	}) => {
		await db
			.insert(user)
			.values({ email, name, photo })
			.onDuplicateKeyUpdate({ set: { email, photo } }) // remove when feature to change photo is added
	},
	get: async () => {
		const row = (
			await db
				.select({
					name: user.name,
					photo: user.photo,
					superuser: user.superuser,
				})
				.from(user)
				.where(eq(user.email, email))
		)[0]

		if (!row) return undefined

		return {
			email,
			name: row.name,
			photo: row.photo ?? undefined,
			superuser: row.superuser ?? false,
		}
	},
	update: async ({ name, photo }: { name?: string; photo?: string }) => {
		await db
			.update(user)
			.set({
				...(name !== undefined ? { name } : {}),
				...(photo !== undefined ? { photo } : {}),
			})
			.where(eq(user.email, email))
	},
	delete: async () => {
		await Promise.all([
			db.delete(user).where(eq(user.email, email)),
			db
				.delete(teacherToCourse)
				.where(eq(teacherToCourse.teacherEmail, email)),
			db
				.delete(studentToCourse)
				.where(eq(studentToCourse.studentEmail, email)),
			db
				.delete(studentInsight)
				.where(eq(studentInsight.studentEmail, email)),
			db.delete(feedback).where(eq(feedback.userEmail, email)),
		])
	},
	coursesTeaching: async () => {
		const teaching = await db
			.select({
				id: course.id,
				name: course.name,
				section: course.section,
				syncedUrl: course.syncedUrl,
			})
			.from(teacherToCourse)
			.innerJoin(course, eq(course.id, teacherToCourse.courseId))
			.where(eq(teacherToCourse.teacherEmail, email))

		return teaching.map((course) => ({
			...course,
			section: course.section ?? undefined,
			linkedUrl: course.syncedUrl ?? undefined,
		}))
	},
	coursesEnrolled: async () => {
		const enrolled = await db
			.select({
				id: course.id,
				name: course.name,
				section: course.section,
				syncedUrl: course.syncedUrl,
			})
			.from(studentToCourse)
			.innerJoin(course, eq(course.id, studentToCourse.courseId))
			.where(eq(studentToCourse.studentEmail, email))

		return enrolled.map((course) => ({
			...course,
			section: course.section ?? undefined,
			syncedUrl: course.syncedUrl ?? undefined,
		}))
	},
	addToCourse: async ({
		id,
		role,
		synced,
	}: {
		id: string
		role: "teacher" | "student"
		synced: boolean
	}) => {
		if (role === "teacher") {
			await db
				.insert(teacherToCourse)
				.values({
					teacherEmail: email,
					courseId: id,
					syncedAt: synced ? new Date() : undefined,
				})
				.onDuplicateKeyUpdate({ set: { teacherEmail: email } })
		}

		if (role === "student") {
			await db
				.insert(studentToCourse)
				.values({
					studentEmail: email,
					courseId: id,
					syncedAt: synced ? new Date() : undefined,
				})
				.onDuplicateKeyUpdate({ set: { studentEmail: email } })
		}
	},
	removeFromCourse: async ({
		id,
		role,
	}: {
		id: string
		role: "teacher" | "student"
	}) => {
		if (role === "teacher") {
			await db
				.delete(teacherToCourse)
				.where(
					and(
						eq(teacherToCourse.teacherEmail, email),
						eq(teacherToCourse.courseId, id)
					)
				)
		}

		if (role === "student") {
			await db
				.delete(studentToCourse)
				.where(
					and(
						eq(studentToCourse.studentEmail, email),
						eq(studentToCourse.courseId, id)
					)
				)
		}
	},
	courseRole: async ({ id }: { id: string }) => {
		const [teacherRow, studentRow] = await Promise.all([
			db
				.select({ id: teacherToCourse.courseId })
				.from(teacherToCourse)
				.where(
					and(
						eq(teacherToCourse.courseId, id),
						eq(teacherToCourse.teacherEmail, email)
					)
				)
				.then((rows) => rows[0]),
			db
				.select({ id: studentToCourse.courseId })
				.from(studentToCourse)
				.where(
					and(
						eq(studentToCourse.courseId, id),
						eq(studentToCourse.studentEmail, email)
					)
				)
				.then((rows) => rows[0]),
		])

		if (teacherRow !== undefined) return "teacher" as const

		if (studentRow !== undefined) return "student" as const

		return "none" as const
	},
	feedbackHistory: async ({
		courseId,
		assignmentId,
	}: {
		courseId: string
		assignmentId: string
	}) => {
		return (
			await db
				.select({
					givenAt: feedback.givenAt,
					submissionHTML: feedback.submissionHTML,
					unrevisedSubmissionHTML: feedback.unrevisedSubmissionHTML,
					list: feedback.list,
					rawResponse: feedback.rawResponse,
				})
				.from(feedback)
				.where(
					and(
						eq(feedback.courseId, courseId),
						eq(feedback.assignmentId, assignmentId),
						eq(feedback.userEmail, email)
					)
				)
		).map(
			({
				givenAt,
				submissionHTML,
				unrevisedSubmissionHTML,
				list,
				rawResponse,
			}) => {
				return {
					givenAt: givenAt,
					submissionHTML,
					unrevisedSubmissionHTML,
					list: feedbackListSchema.parse(list),
					rawResponse,
				}
			}
		)
	},
	upcomingAssignments: async () => {
		const [
			{ assignmentsTeaching, isTeaching },
			{ assignmentsEnrolled, isEnrolled },
		] = await Promise.all([
			db
				.select({
					courseId: teacherToCourse.courseId,
					assignmentId: assignment.assignmentId,
					title: assignment.title,
					dueAt: assignment.dueAt,
				})
				.from(teacherToCourse)
				.leftJoin(
					assignment,
					eq(assignment.courseId, teacherToCourse.courseId)
				)
				.where(
					and(
						eq(teacherToCourse.teacherEmail, email),
						or(
							gt(assignment.dueAt, new Date()),
							isNull(assignment.dueAt)
						)
					)
				)
				.then((rows) => ({
					isTeaching: rows.length !== 0,
					assignmentsTeaching: rows
						.map((row) =>
							row.assignmentId !== null &&
							row.title !== null &&
							row.dueAt !== null
								? {
										courseId: row.courseId,
										assignmentId: row.assignmentId,
										title: row.title,
										dueAt: row.dueAt,
								  }
								: undefined
						)
						.filter(Boolean),
				})),
			db
				.select({
					courseId: studentToCourse.courseId,
					assignmentId: assignment.assignmentId,
					title: assignment.title,
					dueAt: assignment.dueAt,
				})
				.from(studentToCourse)
				.leftJoin(
					assignment,
					eq(assignment.courseId, studentToCourse.courseId)
				)
				.where(
					and(
						eq(studentToCourse.studentEmail, email),
						or(
							gt(assignment.dueAt, new Date()),
							isNull(assignment.dueAt)
						)
					)
				)
				.then((rows) => ({
					isEnrolled: rows.length !== 0,
					assignmentsEnrolled: rows
						.map((row) =>
							row.assignmentId !== null &&
							row.title !== null &&
							row.dueAt !== null
								? {
										courseId: row.courseId,
										assignmentId: row.assignmentId,
										title: row.title,
										dueAt: row.dueAt,
								  }
								: undefined
						)
						.filter(Boolean),
				})),
		])

		return {
			assignmentsTeaching,
			assignmentsEnrolled,
			isTeaching,
			isEnrolled,
		}
	},
	upsertInsights: async ({
		courseId,
		insights,
	}: {
		courseId: string
		insights: StudentInsights
	}) => {
		await db
			.insert(studentInsight)
			.values({
				courseId,
				studentEmail: email,
				insights,
			})
			.onDuplicateKeyUpdate({
				set: {
					insights,
					syncedAt: sql`CURRENT_TIMESTAMP`,
				},
			})
	},
	insights: async ({ courseId }: { courseId: string }) => {
		const row = (
			await db
				.select()
				.from(studentInsight)
				.where(
					and(
						eq(studentInsight.courseId, courseId),
						eq(studentInsight.studentEmail, email)
					)
				)
		)[0]

		return row && studentInsightsSchema.parse(row.insights)
	},
	lastFeedbackInsights: async ({
		courseId,
		assignmentId,
	}: {
		courseId: string
		assignmentId: string
	}) => {
		const [row] = await db
			.select({
				submissionHTML: feedback.submissionHTML,
				insights: feedback.insights,
			})
			.from(feedback)
			.where(
				and(
					eq(feedback.courseId, courseId),
					eq(feedback.assignmentId, assignmentId),
					isNotNull(feedback.insights)
				)
			)
			.orderBy(desc(feedback.givenAt))
			.limit(1)

		return (
			row && {
				submissionHTML: row.submissionHTML,
				insights: feedbackInsightsSchema.parse(row.insights),
			}
		)
	},
	unsyncedFeedbackInsights: async ({ courseId }: { courseId: string }) => {
		return (
			await db
				.select({
					assignmentId: feedback.assignmentId,
					givenAt: feedback.givenAt,
					insights: feedback.insights,
				})
				.from(feedback)
				.where(
					and(
						eq(feedback.courseId, courseId),
						eq(feedback.userEmail, email),
						isNull(feedback.syncedInsightsAt),
						isNotNull(feedback.insights)
					)
				)
		).map((row) => ({
			...row,
			insights: feedbackInsightsSchema.parse(row.insights),
		}))
	},
})

export default User
