import { eq, and } from "drizzle-orm/expressions"

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
		instructions,
		studentDescription,
		dueAt,
	}: {
		title: string
		instructions: string
		studentDescription?: string
		dueAt?: Date
	}) => {
		await db.insert(assignment).values({
			courseId,
			assignmentId,
			title,
			instructions,
			studentDescription,
			dueAt,
		})
	},
	get: async () => {
		const row = (
			await db
				.select({
					title: assignment.title,
					instructions: assignment.instructions,
					studentDescription: assignment.studentDescription,
					dueAt: assignment.dueAt,
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
			instructions: row.instructions,
			studentDescription: row.studentDescription ?? undefined,
			dueAt: row.dueAt ?? undefined,
		}
	},
	update: async ({
		title,
		instructions,
		studentDescription,
		dueAt,
	}: {
		title?: string
		instructions?: string
		studentDescription?: string
		dueAt?: Date
	}) => {
		await db
			.update(assignment)
			.set({
				...(title !== undefined ? { title } : {}),
				...(instructions !== undefined ? { instructions } : {}),
				...(studentDescription !== undefined
					? { studentDescription }
					: {}),
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
