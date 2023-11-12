import { desc, eq, and, lt, isNotNull, isNull, sql } from "drizzle-orm"

import vdbPromise from "~/db/vdb"
import db from "~/db/db"
import {
	user,
	course,
	studentToCourse,
	teacherToCourse,
	assignment,
	feedback,
	studentInsight,
	assignmentInsight,
} from "~/db/schema"
import { feedbackInsightsSchema } from "./Feedback"

export type Course = Exclude<
	Awaited<ReturnType<ReturnType<typeof Course>["get"]>>,
	undefined
>

const Course = ({ id }: { id: string }) => ({
	create: async ({
		name,
		section,
		syncedUrl,
		syncedRefreshToken,
	}: {
		name: string
		section: string | undefined
		syncedUrl: string | undefined
		syncedRefreshToken: string | undefined
	}) => {
		await db
			.insert(course)
			.values({
				id,
				name,
				section,
				inviteCode: Array(7)
					.fill(0)
					.map(() => {
						const index = Math.floor(Math.random() * 62)

						if (index < 10) {
							return index.toString()
						} else if (index < 36) {
							return String.fromCharCode(index - 10 + 97)
						} else {
							return String.fromCharCode(index - 36 + 65)
						}
					})
					.join(""),
				syncedUrl,
				syncedRefreshToken,
			})
			.onDuplicateKeyUpdate({
				set: { name, section, syncedUrl, syncedRefreshToken },
			})
	},
	get: async () => {
		const row = (
			await db
				.select({
					name: course.name,
					section: course.section,
					syncedUrl: course.syncedUrl,
				})
				.from(course)
				.where(eq(course.id, id))
		)[0]

		if (!row) return undefined

		return {
			id,
			name: row.name,
			section: row.section ?? undefined,
			syncedUrl: row.syncedUrl ?? undefined,
		}
	},
	update: async ({
		name,
		section,
		syncedRefreshToken,
	}: {
		name?: string
		section?: string | null
		syncedRefreshToken?: string
	}) => {
		await db
			.update(course)
			.set({
				name,
				section,
				syncedRefreshToken,
			})
			.where(eq(course.id, id))
	},
	delete: async () => {
		await Promise.all([
			db.delete(course).where(eq(course.id, id)),
			db.delete(teacherToCourse).where(eq(teacherToCourse.courseId, id)),
			db.delete(studentToCourse).where(eq(studentToCourse.courseId, id)),
			db.delete(assignment).where(eq(assignment.courseId, id)),
			db.delete(feedback).where(eq(feedback.courseId, id)),
			vdbPromise.then((vdb) =>
				vdb.delete1({
					deleteAll: true,
					namespace: `resource:${id}`,
				}),
			),
			db.delete(studentInsight).where(eq(studentInsight.courseId, id)),
			db
				.delete(assignmentInsight)
				.where(eq(assignmentInsight.courseId, id)),
		])
	},
	syncedRefreshToken: async () => {
		return (
			(
				await db
					.select({
						syncedRefreshToken: course.syncedRefreshToken,
					})
					.from(course)
					.where(eq(course.id, id))
			)[0]?.syncedRefreshToken ?? undefined
		)
	},
	inviteCode: async () => {
		return (
			(
				await db
					.select({
						inviteCode: course.inviteCode,
					})
					.from(course)
					.where(eq(course.id, id))
			)[0]?.inviteCode ?? undefined
		)
	},
	teachers: async () => {
		const teachers = await db
			.select({
				email: teacherToCourse.teacherEmail,
				name: user.name,
				photo: user.photo,
				syncedAt: teacherToCourse.syncedAt,
			})
			.from(teacherToCourse)
			.leftJoin(user, eq(user.email, teacherToCourse.teacherEmail))
			.where(eq(teacherToCourse.courseId, id))

		return teachers.map((teacher) =>
			teacher.name !== null
				? {
						signedUp: true as const,
						email: teacher.email,
						name: teacher.name,
						photo: teacher.photo ?? undefined,
						syncedAt: teacher.syncedAt ?? undefined,
				  }
				: { signedUp: false as const, email: teacher.email },
		)
	},
	students: async () => {
		const students = await db
			.select({
				email: studentToCourse.studentEmail,
				name: user.name,
				photo: user.photo,
				syncedAt: studentToCourse.syncedAt,
			})
			.from(studentToCourse)
			.leftJoin(user, eq(user.email, studentToCourse.studentEmail))
			.where(eq(studentToCourse.courseId, id))

		return students.map((student) =>
			student.name !== null
				? {
						signedUp: true as const,
						email: student.email,
						name: student.name,
						photo: student.photo ?? undefined,
						syncedAt: student.syncedAt ?? undefined,
				  }
				: { signedUp: false as const, email: student.email },
		)
	},
	assignments: async () => {
		const assignments = await db
			.select({
				courseId: assignment.courseId,
				assignmentId: assignment.assignmentId,
				title: assignment.title,
				description: assignment.description,
				instructions: assignment.instructions,
				dueAt: assignment.dueAt,
				syncedUrl: assignment.syncedUrl,
				syncedAt: assignment.syncedAt,
			})
			.from(assignment)
			.where(eq(assignment.courseId, id))
			.orderBy(desc(assignment.dueAt), desc(assignment.createdAt))

		return assignments.map((assignment) => ({
			courseId: assignment.courseId,
			assignmentId: assignment.assignmentId,
			title: assignment.title,
			description: assignment.description ?? undefined,
			instructions: assignment.instructions ?? undefined,
			dueAt: assignment.dueAt ?? undefined,
			syncedUrl: assignment.syncedUrl ?? undefined,
			syncedAt: assignment.syncedAt ?? undefined,
		}))
	},
	feedbackStream: async ({
		limit,
		cursor,
	}: {
		limit: number
		cursor?: number
	}) => {
		const feedbackStream = (
			await db
				.select({
					assignmentId: assignment.assignmentId,
					assignmentTitle: assignment.title,
					userEmail: user.email,
					userName: user.name,
					userPhoto: user.photo,
					givenAt: feedback.givenAt,
				})
				.from(feedback)
				.where(
					cursor === undefined
						? eq(feedback.courseId, id)
						: and(
								eq(feedback.courseId, id),
								lt(feedback.givenAt, new Date(cursor)),
						  ),
				)
				.orderBy(desc(feedback.givenAt))
				.limit(limit)
				.innerJoin(user, eq(user.email, feedback.userEmail))
				.innerJoin(
					assignment,
					and(
						eq(assignment.courseId, id),
						eq(assignment.assignmentId, feedback.assignmentId),
					),
				)
		).map(({ userPhoto, ...feedback }) => ({
			...feedback,
			userPhoto: userPhoto ?? undefined,
		}))

		return {
			feedbackStream,
			cursor:
				feedbackStream.length === limit
					? feedbackStream.at(-1)?.givenAt.valueOf()
					: undefined,
		}
	},
	unsyncedFeedbackInsights: async () => {
		return (
			await db
				.select({
					assignmentId: feedback.assignmentId,
					studentEmail: feedback.userEmail,
					insights: feedback.insights,
				})
				.from(feedback)
				.where(
					and(
						eq(feedback.courseId, id),
						isNull(feedback.syncedInsightsAt),
						isNotNull(feedback.insights),
					),
				)
		).map((row) => ({
			...row,
			insights: feedbackInsightsSchema.parse(row.insights),
		}))
	},
	increaseCost: async (cost: { sync?: number; insights?: number }) => {
		await db
			.update(course)
			.set({
				syncCost: cost.sync && sql`sync_cost + ${cost.sync}`,
				insightsCost:
					cost.insights && sql`insights_cost + ${cost.insights}`,
			})
			.where(eq(course.id, id))
	},
})

export default Course
