import { eq, and, isNotNull, sql, isNull } from "drizzle-orm"
import { z } from "zod"

import db from "~/db/db"
import { assignment, assignmentInsight, feedback } from "~/db/schema"
import { feedbackInsightsSchema } from "./Feedback"
import Course from "./Course"

const assignmentInsightsSchema = z
	.object({
		title: z.string().optional().default(""),
		type: z.enum(["strength", "weakness"]),
		content: z.string(),
		sources: z
			.object({
				studentEmail: z.string(),
				paragraphs: z.number().array(),
			})
			.array(),
	})
	.array()

type AssignmentInsights = z.infer<typeof assignmentInsightsSchema>

export type Assignment = Exclude<
	Awaited<ReturnType<ReturnType<typeof Assignment>["get"]>>,
	undefined
>

const Assignment = ({
	courseId,
	assignmentId,
}: {
	courseId: string
	assignmentId: string
}) => ({
	create: async ({
		title,
		description,
		instructions,
		dueAt,
		syncedUrl,
	}: {
		title: string
		description: string | undefined
		instructions: string | undefined
		dueAt: Date | undefined
		syncedUrl: string | undefined
	}) => {
		await db
			.insert(assignment)
			.values({
				courseId,
				assignmentId,
				title,
				description,
				instructions,
				dueAt,
				syncedUrl,
				syncedAt: syncedUrl !== undefined ? new Date() : undefined,
			})
			.onDuplicateKeyUpdate({
				set: {
					title,
					description: description ?? null,
					instructions: instructions ?? null,
					dueAt: dueAt ?? null,
					syncedUrl: syncedUrl ?? null,
					syncedAt: syncedUrl !== undefined ? new Date() : null,
				},
			})
	},
	get: async () => {
		const row = (
			await db
				.select({
					title: assignment.title,
					description: assignment.description,
					instructions: assignment.instructions,
					dueAt: assignment.dueAt,
					syncedUrl: assignment.syncedUrl,
					syncedAt: assignment.syncedAt,
				})
				.from(assignment)
				.where(
					and(
						eq(assignment.courseId, courseId),
						eq(assignment.assignmentId, assignmentId),
					),
				)
		)[0]

		if (!row) return undefined

		return {
			courseId,
			assignmentId,
			title: row.title,
			description: row.description ?? undefined,
			instructions: row.instructions ?? undefined,
			dueAt: row.dueAt ?? undefined,
			syncedUrl: row.syncedUrl ?? undefined,
			syncedAt: row.syncedAt ?? undefined,
		}
	},
	update: async ({
		title,
		description,
		instructions,
		dueAt,
		syncedAt,
	}: {
		title?: string
		description?: string | null
		instructions?: string
		dueAt?: Date | null
		syncedAt: Date | null
	}) => {
		await db
			.update(assignment)
			.set({
				title,
				description,
				instructions,
				dueAt,
				syncedAt,
			})
			.where(
				and(
					eq(assignment.courseId, courseId),
					eq(assignment.assignmentId, assignmentId),
				),
			)
	},
	delete: async () => {
		await Promise.all([
			db
				.delete(assignment)
				.where(
					and(
						eq(assignment.courseId, courseId),
						eq(assignment.assignmentId, assignmentId),
					),
				),
			db
				.delete(feedback)
				.where(
					and(
						eq(feedback.courseId, courseId),
						eq(feedback.assignmentId, assignmentId),
					),
				),
			Course({ id: courseId }).deleteResources({
				filter: {
					attachmentOnAssignmentId: assignmentId,
				},
			}),
			Course({ id: courseId }).deleteResources({
				filter: {
					instructionsForAssignmentId: assignmentId,
				},
			}),
			db
				.delete(assignmentInsight)
				.where(
					and(
						eq(assignmentInsight.courseId, courseId),
						eq(assignmentInsight.assignmentId, assignmentId),
					),
				),
		])
	},
	upsertInsights: async ({ insights }: { insights: AssignmentInsights }) => {
		await db
			.insert(assignmentInsight)
			.values({
				courseId,
				assignmentId,
				insights,
			})
			.onDuplicateKeyUpdate({
				set: {
					insights,
					syncedAt: sql`CURRENT_TIMESTAMP`,
				},
			})
	},
	insights: async () => {
		const row = (
			await db
				.select()
				.from(assignmentInsight)
				.where(
					and(
						eq(assignmentInsight.courseId, courseId),
						eq(assignmentInsight.assignmentId, assignmentId),
					),
				)
		)[0]

		return row && row.insights
			? assignmentInsightsSchema.parse(row.insights)
			: undefined
	},
	unsyncedFeedbackInsights: async () => {
		return await db
			.select({
				studentEmail: feedback.userEmail,
				givenAt: feedback.givenAt,
				insights: feedback.insights,
			})
			.from(feedback)
			.where(
				and(
					eq(feedback.courseId, courseId),
					eq(feedback.assignmentId, assignmentId),
					isNull(feedback.syncedInsightsAt),
					isNotNull(feedback.insights),
				),
			)
			.then((insights) =>
				insights.map((insight) => ({
					studentEmail: insight.studentEmail,
					givenAt: insight.givenAt,
					insights: feedbackInsightsSchema.parse(insight.insights),
				})),
			)
	},
})

export default Assignment
