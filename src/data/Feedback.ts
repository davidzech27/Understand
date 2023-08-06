import { eq, and } from "drizzle-orm"
import { z } from "zod"

import db from "~/db/db"
import { feedback } from "~/db/schema"

export const feedbackInsightsSchema = z
	.object({
		type: z.enum(["strength", "weakness"]),
		paragraphs: z.number().array(),
		content: z.string(),
	})
	.array()

export type FeedbackInsights = z.infer<typeof feedbackInsightsSchema>

export const followUpSchema = z.object({
	userMessage: z.string(),
	revisions: z
		.object({
			paragraph: z.number(),
			sentence: z.number(),
			oldContent: z.string(),
			newContent: z.string(),
		})
		.array()
		.optional()
		.default([]),
	aiMessage: z.string(),
	sentAt: z.coerce.date(),
})

type FollowUp = z.infer<typeof followUpSchema>

export const feedbackListSchema = z
	.object({
		paragraph: z.number().optional(),
		sentence: z.number().optional(),
		content: z.string(),
		followUps: followUpSchema.array(),
	})
	.array()

type FeedbackList = z.infer<typeof feedbackListSchema>

export type Feedback = Exclude<
	Awaited<ReturnType<ReturnType<typeof Feedback>["get"]>>,
	undefined
>

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
		list,
		rawResponse,
	}: {
		submissionHTML: string
		list: FeedbackList
		rawResponse: string
	}) => {
		await db.insert(feedback).values({
			courseId,
			assignmentId,
			userEmail,
			givenAt,
			submissionHTML,
			unrevisedSubmissionHTML: submissionHTML,
			list,
			rawResponse,
		})
	},
	get: async () => {
		const row = (
			await db
				.select({
					givenAt: feedback.givenAt,
					submissionHTML: feedback.submissionHTML,
					unrevisedSubmissionHTML: feedback.unrevisedSubmissionHTML,
					list: feedback.list,
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

		return (
			row && {
				givenAt: row.givenAt,
				submissionHTML: row.submissionHTML,
				unrevisedSubmissionHTML: row.unrevisedSubmissionHTML,
				list: feedbackListSchema.parse(row.list),
				rawResponse: row.rawResponse,
			}
		)
	},
	update: async ({
		submissionHTML,
		insights,
	}: {
		submissionHTML?: string
		insights?: FeedbackInsights
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
	addFollowUp: async ({
		paragraph,
		sentence,
		followUp,
	}: {
		paragraph?: number
		sentence?: number
		followUp: FollowUp
	}) => {
		await db.transaction(
			async (tx) => {
				const feedbackList = feedbackListSchema.parse(
					(
						await db
							.select({ list: feedback.list })
							.from(feedback)
							.where(
								and(
									eq(feedback.courseId, courseId),
									eq(feedback.assignmentId, assignmentId),
									eq(feedback.userEmail, userEmail),
									eq(feedback.givenAt, givenAt)
								)
							)
					)[0]?.list
				)

				feedbackList
					.find(
						(feedback) =>
							feedback.paragraph === paragraph &&
							feedback.sentence === sentence
					)
					?.followUps.push(followUp)

				await tx
					.update(feedback)
					.set({ list: feedbackList })
					.where(
						and(
							eq(feedback.courseId, courseId),
							eq(feedback.assignmentId, assignmentId),
							eq(feedback.userEmail, userEmail),
							eq(feedback.givenAt, givenAt)
						)
					)
			},
			{
				isolationLevel: "serializable",
			}
		)
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
				submissionHTML: row.submissionHTML,
				insights: feedbackInsightsSchema.parse(row.insights),
			}
		)
	},
	updateSynced: async ({
		insights: oldInsights,
	}: {
		insights: FeedbackInsights
	}) => {
		await db.transaction(
			async (tx) => {
				const newInsights = feedbackInsightsSchema.parse(
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
						.set({ syncedInsightsAt: new Date() })
						.where(
							and(
								eq(feedback.courseId, courseId),
								eq(feedback.assignmentId, assignmentId),
								eq(feedback.userEmail, userEmail),
								eq(feedback.givenAt, givenAt)
							)
						)
				}
			},
			{
				isolationLevel: "serializable",
			}
		)
	},
})

export default Feedback
