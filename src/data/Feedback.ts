import { eq, and } from "drizzle-orm"

import db from "~/db/db"
import { feedback, followUp } from "~/db/schema"

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
		rawResponse,
		metadata,
	}: {
		submission: string
		rawResponse: string
		metadata: Record<string, unknown>
	}) => {
		await db.insert(feedback).values({
			courseId,
			assignmentId,
			userEmail,
			givenAt,
			submission,
			rawResponse,
			metadata,
		})
	},
	get: async () => {
		const row = (
			await db
				.select({
					submission: feedback.submission,
					rawResponse: feedback.rawResponse,
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
			rawResponse: row.rawResponse,
			metadata: row.metadata,
		}
	},
	delete: async () => {
		await Promise.all([
			db
				.delete(feedback)
				.where(
					and(
						eq(feedback.courseId, courseId),
						eq(feedback.assignmentId, assignmentId),
						eq(feedback.userEmail, userEmail),
						eq(feedback.givenAt, givenAt)
					)
				),
			db
				.delete(followUp)
				.where(
					and(
						eq(followUp.courseId, courseId),
						eq(followUp.assignmentId, assignmentId),
						eq(followUp.userEmail, userEmail),
						eq(followUp.feedbackGivenAt, givenAt)
					)
				),
		])
	},
	addFollowUp: async ({
		paragraphNumber,
		sentenceNumber,
		query,
		rawResponse,
		metadata,
	}: {
		paragraphNumber: number | undefined
		sentenceNumber: number | undefined
		query: string
		rawResponse: string
		metadata: Record<string, unknown>
	}) => {
		db.insert(followUp).values({
			courseId,
			assignmentId,
			userEmail,
			feedbackGivenAt: givenAt,
			givenAt: new Date(),
			paragraphNumber,
			sentenceNumber,
			query,
			rawResponse,
			metadata,
		})
	},
})

export default Feedback
