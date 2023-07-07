import { eq, and, isNotNull } from "drizzle-orm"
import { z } from "zod"

import db from "~/db/db"
import { assignment, assignmentInsight, feedback, followUp } from "~/db/schema"
import Course from "./Course"
import { insightsSchema as feedbackInsightsSchema } from "./Feedback"

const insightsSchema = z
	.object({
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

type Insights = z.infer<typeof insightsSchema>

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
		context,
		dueAt,
		linkedUrl,
		instructionsLinked,
	}: {
		title: string
		description: string | undefined
		instructions: string | undefined
		context: string | undefined
		dueAt: Date | undefined
		linkedUrl: string | undefined
		instructionsLinked: boolean
	}) => {
		await db
			.insert(assignment)
			.values({
				courseId,
				assignmentId,
				title,
				description,
				instructions,
				context,
				dueAt,
				linkedUrl,
				instructionsLinked,
			})
			.onDuplicateKeyUpdate({
				set: {
					...(title !== undefined ? { title } : {}),
					...(description !== undefined ? { description } : {}),
					...(instructions !== undefined ? { instructions } : {}),
					...(context !== undefined ? { context } : {}),
					...(dueAt !== undefined ? { dueAt } : {}),
					...(instructionsLinked !== undefined
						? { instructionsLinked }
						: {}),
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
					context: assignment.context,
					dueAt: assignment.dueAt,
					linkedUrl: assignment.linkedUrl,
					instructionsLinked: assignment.instructionsLinked,
				})
				.from(assignment)
				.where(
					and(
						eq(assignment.courseId, courseId),
						eq(assignment.assignmentId, assignmentId)
					)
				)
		)[0]

		if (!row) return undefined

		return {
			courseId,
			assignmentId,
			title: row.title,
			description: row.description ?? undefined,
			instructions: row.instructions ?? undefined,
			context: row.context ?? undefined,
			dueAt:
				(row.dueAt &&
					new Date(
						Date.UTC(
							row.dueAt.getFullYear(),
							row.dueAt.getMonth(),
							row.dueAt.getDate(),
							row.dueAt.getHours(),
							row.dueAt.getMinutes()
						)
					)) ??
				undefined,
			linkedUrl: row.linkedUrl ?? undefined,
			instructionsLinked: row.instructionsLinked ?? false,
		}
	},
	update: async ({
		title,
		description,
		instructions,
		context,
		dueAt,
		instructionsLinked,
	}: {
		title?: string
		description?: string | null
		instructions?: string
		context?: string
		dueAt?: Date | null
		instructionsLinked?: boolean
	}) => {
		await db
			.update(assignment)
			.set({
				...(title !== undefined ? { title } : {}),
				...(description !== undefined ? { description } : {}),
				...(instructions !== undefined ? { instructions } : {}),
				...(context !== undefined ? { context } : {}),
				...(dueAt !== undefined ? { dueAt } : {}),
				...(instructionsLinked !== undefined
					? { instructionsLinked }
					: {}),
			})
			.where(
				and(
					eq(assignment.courseId, courseId),
					eq(assignment.assignmentId, assignmentId)
				)
			)
	},
	upsertInsights: async ({ insights }: { insights: Insights }) => {
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
						eq(assignmentInsight.assignmentId, assignmentId)
					)
				)
		)[0]

		return row && insightsSchema.parse(row.insights)
	},
	//! make sure that only students
	unsyncedInsights: async () => {
		return await db
			.select({
				studentEmail: feedback.userEmail,
				insights: feedback.insights,
				givenAt: feedback.givenAt,
			})
			.from(feedback)
			.where(
				and(
					eq(feedback.courseId, courseId),
					eq(feedback.assignmentId, assignmentId),
					eq(feedback.synced, false),
					isNotNull(feedback.insights)
				)
			)
			.then((insights) =>
				insights.map((insight) => ({
					studentEmail: insight.studentEmail,
					insights: feedbackInsightsSchema.parse(insight.insights),
					givenAt: insight.givenAt,
				}))
			)
	},
	delete: async () => {
		await Promise.all([
			db
				.delete(assignment)
				.where(
					and(
						eq(assignment.courseId, courseId),
						eq(assignment.assignmentId, assignmentId)
					)
				),
			db
				.delete(feedback)
				.where(
					and(
						eq(feedback.courseId, courseId),
						eq(feedback.assignmentId, assignmentId)
					)
				),
			db
				.delete(followUp)
				.where(
					and(
						eq(feedback.courseId, courseId),
						eq(feedback.assignmentId, assignmentId)
					)
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
						eq(assignmentInsight.assignmentId, assignmentId)
					)
				),
		])
	},
})

export default Assignment
