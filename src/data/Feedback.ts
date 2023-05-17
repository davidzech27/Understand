import { eq, and } from "drizzle-orm/expressions"

import db from "~/db/db"
import { feedback } from "~/db/schema"

const Feedback = ({
	courseId,
	assignmentId,
	userEmail,
	givenAt,
}: {
	courseId: string
	assignmentId: string
	userEmail: string
	givenAt: Date
}) => ({
	create: async ({
		submission,
		rawFeedback,
		metadata,
	}: {
		submission: string
		rawFeedback: string
		metadata: Record<string, string>
	}) => {
		await db.insert(feedback).values({
			courseId,
			assignmentId,
			userEmail,
			givenAt,
			submission,
			rawFeedback,
			metadata,
		})
	},
	get: async () => {
		const row = (
			await db
				.select({
					submission: feedback.submission,
					rawFeedback: feedback.rawFeedback,
					metadata: feedback.metadata,
				})
				.from(feedback)
				.where(
					and(
						eq(feedback.courseId, courseId),
						eq(feedback.assignmentId, assignmentId),
						eq(feedback.userEmail, userEmail),
						eq(feedback.givenAt, givenAt)
					)
				)
		)[0]

		if (!row) return undefined

		return {
			courseId,
			assignmentId,
			userEmail,
			givenAt,
			submission: row.submission,
			rawFeedback: row.rawFeedback,
			metadata: row.metadata,
		}
	},
	delete: async () => {
		await db
			.delete(feedback)
			.where(
				and(
					eq(feedback.courseId, courseId),
					eq(feedback.assignmentId, assignmentId),
					eq(feedback.userEmail, userEmail),
					eq(feedback.givenAt, givenAt)
				)
			)
	},
})

export default Feedback
