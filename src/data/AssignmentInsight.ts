import { and, eq } from "drizzle-orm"
import { z } from "zod"

import db from "~/db/db"
import { assignmentInsight } from "~/db/schema"

const insightsSchema = z
	.object({
		type: z.enum(["strength", "weakness"]),
		content: z.string(),
		sources: z
			.object({
				studentEmail: z.string(),
				paragraphs: z.number().array(),
			})
			.array(),
	})
	.array()

type Insights = z.infer<typeof insightsSchema>

const AssignmentInsight = ({
	courseId,
	assignmentId,
}: {
	courseId: string
	assignmentId: string
}) => ({
	upsert: async ({ insights }: { insights: Insights }) => {
		await db
			.insert(assignmentInsight)
			.values({
				courseId,
				assignmentId,
				insights,
			})
			.onDuplicateKeyUpdate({
				set: {
					insights,
				},
			})
	},
	get: async () => {
		const row = (
			await db
				.select()
				.from(assignmentInsight)
				.where(
					and(
						eq(assignmentInsight.courseId, courseId),
						eq(assignmentInsight.assignmentId, assignmentId)
					)
				)
		)[0]

		return row && insightsSchema.parse(row.insights)
	},
})

export default AssignmentInsight
