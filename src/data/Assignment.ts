import { eq, and } from "drizzle-orm"

import db from "~/db/db"
import {
	assignment,
	assignmentInsight,
	feedback,
	followUp,
	insight,
	studentInsight,
} from "~/db/schema"
import Resource from "./Resource"

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
			Resource({ courseId }).delete({
				filter: {
					attachmentOnAssignmentId: assignmentId,
				},
			}),
			Resource({ courseId }).delete({
				filter: {
					instructionsForAssignmentId: assignmentId,
				},
			}),
			db
				.delete(insight)
				.where(
					and(
						eq(insight.courseId, courseId),
						eq(insight.assignmentId, assignmentId)
					)
				),
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
