import { and, eq } from "drizzle-orm"
import { z } from "zod"

import db from "~/db/db"
import { studentInsight } from "~/db/schema"

const insightsSchema = z
	.object({
		type: z.string(),
		content: z.string(),
		sources: z
			.object({
				assignmentId: z.string(),
				paragraphs: z.number().array(),
			})
			.array(),
	})
	.array()

type Insights = z.infer<typeof insightsSchema>

const StudentInsight = ({
	courseId,
	studentEmail,
}: {
	courseId: string
	studentEmail: string
}) => ({
	upsert: async ({ insights }: { insights: Insights }) => {
		await db
			.insert(studentInsight)
			.values({
				courseId,
				studentEmail,
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
				.from(studentInsight)
				.where(
					and(
						eq(studentInsight.courseId, courseId),
						eq(studentInsight.studentEmail, studentEmail)
					)
				)
		)[0]

		return row && insightsSchema.parse(row.insights)
	},
})

export default StudentInsight
