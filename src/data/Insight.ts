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
	upsert: async ({ insights }: { insights: Insights }) => {
		await db
			.insert(insight)
			.values({
				courseId,
				assignmentId,
				studentEmail,
				insights,
				synced: false,
			})
			.onDuplicateKeyUpdate({
				set: {
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
})

export default Insight
