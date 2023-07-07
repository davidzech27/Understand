import { eq, and } from "drizzle-orm"
import { z } from "zod"

import db from "~/db/db"
import { feedback, followUp } from "~/db/schema"

export const insightsSchema = z
	.object({
		type: z.enum(["strength", "weakness"]),
		paragraphs: z.number().array(),
		content: z.string(),
	})
	.array()

type Insights = z.infer<typeof insightsSchema>

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
		submissionHTML,
		rawResponse,
		metadata,
	}: {
		submissionHTML: string
		rawResponse: string
		metadata: Record<string, unknown>
	}) => {
		await db.insert(feedback).values({
			courseId,
			assignmentId,
			userEmail,
			givenAt,
			submissionHTML,
			rawResponse,
			metadata,
		})
	},
	get: async () => {
		const row = (
			await db
				.select({
					submissionHTML: feedback.submissionHTML,
					rawResponse: feedback.rawResponse,
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
			submissionHTML: row.submissionHTML ?? "",
			rawResponse: row.rawResponse,
		}
	},
	followUps: async () => {
		const rows = await db
			.select({
				givenAt: followUp.givenAt,
				query: followUp.query,
				rawResponse: followUp.rawResponse,
				paragraphNumber: followUp.paragraphNumber,
				sentenceNumber: followUp.sentenceNumber,
			})
			.from(followUp)
			.where(
				and(
					eq(followUp.courseId, courseId),
					eq(followUp.assignmentId, assignmentId),
					eq(followUp.userEmail, userEmail),
					eq(followUp.feedbackGivenAt, givenAt)
				)
			)

		return {
			specific: rows
				.map((row) =>
					row.paragraphNumber !== null && row.sentenceNumber !== null
						? {
								paragraphNumber: row.paragraphNumber,
								sentenceNumber: row.sentenceNumber,
								givenAt: row.givenAt,
								query: row.query,
								rawResponse: row.rawResponse,
						  }
						: undefined
				)
				.filter(Boolean)
				.reduce(
					(prev, cur) => {
						const feedback = prev.find(
							(feedback) =>
								feedback.paragraphNumber ===
									cur.paragraphNumber &&
								feedback.sentenceNumber === cur.sentenceNumber
						)

						const message = {
							givenAt: cur.givenAt,
							query: cur.query,
							rawResponse: cur.rawResponse,
						}

						if (feedback === undefined) {
							return [
								...prev,
								{
									paragraphNumber: cur.paragraphNumber,
									sentenceNumber: cur.sentenceNumber,
									messages: [message],
								},
							]
						} else {
							feedback.messages.push(message)

							return prev
						}
					},
					[] as {
						paragraphNumber: number
						sentenceNumber: number
						messages: {
							givenAt: Date
							query: string
							rawResponse: string
						}[]
					}[]
				)
				.map((feedback) => ({
					...feedback,
					messages: feedback.messages
						.sort(
							(row1, row2) =>
								row1.givenAt.valueOf() - row2.givenAt.valueOf()
						)
						.map((row) => [row.query, row.rawResponse])
						.flat(),
				})),
			general: rows
				.filter(
					(row) =>
						row.paragraphNumber === null &&
						row.sentenceNumber === null
				)
				.sort(
					(row1, row2) =>
						row1.givenAt.valueOf() - row2.givenAt.valueOf()
				)
				.map((row) => [row.query, row.rawResponse])
				.flat(),
		}
	},
	insights: async () => {
		const row = (
			await db
				.select({
					insights: feedback.insights,
					submissionHTML: feedback.submissionHTML,
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

		return (
			row && {
				insights: insightsSchema.parse(row.insights),
				submissionHTML: row.submissionHTML,
			}
		)
	},
	update: async ({
		submissionHTML,
		insights,
	}: {
		submissionHTML?: string
		insights?: Insights
	}) => {
		await db
			.update(feedback)
			.set({
				submissionHTML,
				insights,
			})
			.where(
				and(
					eq(feedback.courseId, courseId),
					eq(feedback.assignmentId, assignmentId),
					eq(feedback.userEmail, userEmail),
					eq(feedback.givenAt, givenAt)
				)
			)
	},
	updateSynced: async ({ insights: oldInsights }: { insights: Insights }) => {
		await db.transaction(
			async (tx) => {
				const newInsights = insightsSchema.parse(
					(
						await tx
							.select({ insights: feedback.insights })
							.from(feedback)
							.where(
								and(
									eq(feedback.courseId, courseId),
									eq(feedback.assignmentId, assignmentId),
									eq(feedback.userEmail, userEmail),
									eq(feedback.givenAt, givenAt)
								)
							)
					)[0]?.insights
				)

				if (
					oldInsights.map((insight) => insight.content).join("\n") ===
					newInsights.map((insight) => insight.content).join("\n")
				) {
					await tx
						.update(feedback)
						.set({ synced: true })
						.where(
							and(
								eq(feedback.courseId, courseId),
								eq(feedback.assignmentId, assignmentId),
								eq(feedback.userEmail, userEmail)
							)
						)
				}
			},
			{
				isolationLevel: "serializable",
			}
		)
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
		await db.insert(followUp).values({
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
