import { eq, and } from "drizzle-orm/expressions"

import db from "~/db/db"
import { assignment, feedback, followUp } from "~/db/schema"
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
	}: {
		title: string
		description: string | undefined
		instructions: string | undefined
		context: string | undefined
		dueAt: Date | undefined
		linkedUrl: string | undefined
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
			})
			.onDuplicateKeyUpdate({
				set: {
					...(title !== undefined ? { title } : {}),
					...(description !== undefined ? { description } : {}),
					...(instructions !== undefined ? { instructions } : {}),
					...(context !== undefined ? { context } : {}),
					...(dueAt !== undefined ? { dueAt } : {}),
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
			dueAt: row.dueAt ?? undefined,
			linkedUrl: row.linkedUrl ?? undefined,
		}
	},
	update: async ({
		title,
		description,
		instructions,
		context,
		dueAt,
	}: {
		title?: string
		description?: string
		instructions?: string
		context?: string
		dueAt?: Date
	}) => {
		await db
			.update(assignment)
			.set({
				...(title !== undefined ? { title } : {}),
				...(description !== undefined ? { description } : {}),
				...(instructions !== undefined ? { instructions } : {}),
				...(context !== undefined ? { context } : {}),
				...(dueAt !== undefined ? { dueAt } : {}),
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
				where: {
					attachmentOnAssignmentId: assignmentId,
				},
			}),
			Resource({ courseId }).delete({
				where: {
					instructionsForAssignmentId: assignmentId,
				},
			}),
		])
	},
})

export default Assignment
