import { eq, and } from "drizzle-orm/expressions"
import { LucideUnlink } from "lucide-react"

import db from "~/db/db"
import { assignment } from "~/db/schema"

const Assignment = ({
	courseId,
	assignmentId,
}: {
	courseId: string
	assignmentId: string
}) => ({
	create: async ({
		title,
		studentDescription,
		instructions,
		context,
		dueAt,
		linkedUrl,
	}: {
		title: string
		studentDescription: string | undefined
		instructions: string | undefined
		context: string | undefined
		dueAt: Date | undefined
		linkedUrl: string | undefined
	}) => {
		await db.insert(assignment).values({
			courseId,
			assignmentId,
			title,
			studentDescription,
			instructions,
			context,
			dueAt,
			linkedUrl,
		})
	},
	get: async () => {
		const row = (
			await db
				.select({
					title: assignment.title,
					studentDescription: assignment.studentDescription,
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
			studentDescription: row.studentDescription ?? undefined,
			instructions: row.instructions ?? undefined,
			context: row.context ?? undefined,
			dueAt: row.dueAt ?? undefined,
		}
	},
	update: async ({
		title,
		studentDescription,
		instructions,
		context,
		dueAt,
	}: {
		title?: string
		studentDescription?: string
		instructions?: string
		context?: string
		dueAt?: Date
		// linkedUrl can't be changed'
	}) => {
		await db
			.update(assignment)
			.set({
				...(title !== undefined ? { title } : {}),
				...(studentDescription !== undefined
					? { studentDescription }
					: {}),
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
		await db
			.delete(assignment)
			.where(
				and(
					eq(assignment.courseId, courseId),
					eq(assignment.assignmentId, assignmentId)
				)
			)
	},
})

export default Assignment
