import { and, eq } from "drizzle-orm"
import { z } from "zod"

import db from "~/db/db"
import { insight } from "~/db/schema"

export const insightsSchema = z
	.object({
		type: z.enum(["strength", "weakness"]),
		paragraphs: z.number().array(),
		content: z.string(),
	})
	.array()

type Insights = z.infer<typeof insightsSchema>

const Insight = ({
	courseId,
	assignmentId,
	studentEmail,
}: {
	courseId: string
	assignmentId: string
	studentEmail: string
}) => ({
	upsert: async ({
		submission,
		insights,
	}: {
		submission: string
		insights: Insights
	}) => {
		await db
			.insert(insight)
			.values({
				courseId,
				assignmentId,
				studentEmail,
				submission,
				insights,
				synced: false,
			})
			.onDuplicateKeyUpdate({
				set: {
					submission,
					insights,
					synced: false,
				},
			})
	},
	updateSynced: async ({ insights: oldInsights }: { insights: Insights }) => {
		await db.transaction(
			async (tx) => {
				const newInsights = insightsSchema.parse(
					(
						await tx
							.select({ insights: insight.insights })
							.from(insight)
							.where(
								and(
									eq(insight.courseId, courseId),
									eq(insight.assignmentId, assignmentId),
									eq(insight.studentEmail, studentEmail)
								)
							)
					)[0]?.insights
				)

				if (
					oldInsights.map((insight) => insight.content).join("\n") ===
					newInsights.map((insight) => insight.content).join("\n")
				) {
					await tx
						.update(insight)
						.set({ synced: true })
						.where(
							and(
								eq(insight.courseId, courseId),
								eq(insight.assignmentId, assignmentId),
								eq(insight.studentEmail, studentEmail)
							)
						)
				}
			},
			{
				isolationLevel: "serializable",
			}
		)
	},
	get: async () => {
		const row = (
			await db
				.select({
					insights: insight.insights,
					submission: insight.submission,
				})
				.from(insight)
				.where(
					and(
						eq(insight.courseId, courseId),
						eq(insight.assignmentId, assignmentId),
						eq(insight.studentEmail, studentEmail)
					)
				)
		)[0]

		return (
			row && {
				insights: insightsSchema.parse(row.insights),
				submission: row.submission ?? "",
			}
		)
	},
	submission: async () => {
		return (
			(
				await db
					.select({ submission: insight.submission })
					.from(insight)
					.where(
						and(
							eq(insight.courseId, courseId),
							eq(insight.assignmentId, assignmentId),
							eq(insight.studentEmail, studentEmail)
						)
					)
			)[0]?.submission ?? ""
		)
	},
})

export default Insight
