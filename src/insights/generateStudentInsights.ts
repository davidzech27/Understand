import { and, eq } from "drizzle-orm"

import db from "~/db/db"
import { insight } from "~/db/schema"
import Insight, { insightsSchema } from "~/data/Insight"
import StudentInsight from "~/data/StudentInsight"
import getCompletion from "~/ai/getCompletion"

const generateStudentInsights = async ({
	courseId,
	studentEmail,
}: {
	courseId: string
	studentEmail: string
}) => {
	const [previousStudentInsights, unsyncedInsights] = await Promise.all([
		StudentInsight({ courseId, studentEmail }).get(),
		db
			.select({
				assignmentId: insight.assignmentId,
				insights: insight.insights,
			})
			.from(insight)
			.where(
				and(
					eq(insight.courseId, courseId),
					eq(insight.studentEmail, studentEmail),
					eq(insight.synced, false)
				)
			)
			.then((insights) =>
				insights.map((insight) => ({
					assignmentId: insight.assignmentId,
					insights: insightsSchema.parse(insight.insights),
				}))
			),
	])

	const unsyncedAssignmentIdSet = new Set(
		unsyncedInsights.map((insight) => insight.assignmentId)
	)

	const previousStudentInsightsWithoutUnsynced = previousStudentInsights
		?.map((insight) => ({
			...insight,
			sources: insight.sources.filter(
				(source) => !unsyncedAssignmentIdSet.has(source.assignmentId)
			),
		}))
		.filter((insight) => insight.sources.length > 0)

	const concatenatedInsights = (
		previousStudentInsightsWithoutUnsynced ?? []
	).concat(
		unsyncedInsights
			.map((assignmentInsights) =>
				assignmentInsights.insights.map((insight) => ({
					type: insight.type,
					content: insight.content,
					sources: [
						{
							assignmentId: assignmentInsights.assignmentId,
							paragraphs: insight.paragraphs,
						},
					],
				}))
			)
			.flat()
	)

	const mergedInsightsPromptMessages = [
		{
			role: "system" as const,
			content: "You are a helpful teacher's assistant.",
		},
		{
			role: "user" as const,
			content: `The following is a list of insights regarding the strengths/weaknesses of a student on various assignments:${
				concatenatedInsights
					?.map(
						(insight, index) =>
							`\n\n${index + 1}. ${insight.content}`
					)
					.join("") ?? ""
			}

Some of the above insights may express similar things about the student, and could be combined to form longer insights. Additionally, these insights should be expressed in the context of the student's understanding of the class in general. Rewrite the above insights with this in mind. Do not mix strengths and weaknesses. Use the following format:
Content: {the rewritten insight}
Sources: {the number(s) corresponding the original insight(s) that formed this insight, using a comma-separated list if necessary}

Begin.`,
		},
	]

	const mergedInsightsCompletion = await getCompletion({
		messages: mergedInsightsPromptMessages,
		model: "gpt-4",
		temperature: 0,
		presencePenalty: 0.5,
		frequencyPenalty: 0.5,
	})

	console.info(
		"Merged insight prompt messages: ",
		mergedInsightsPromptMessages
	)

	console.info("Merged insight completion: ", mergedInsightsCompletion)

	const mergedInsights = mergedInsightsCompletion
		.split("\n\n")
		.map((insight) => ({
			content: insight.match(/(?<=^Content:[ ]).+/g)?.[0],
			sources: insight
				.match(/(?<=\nSources:[ ]).+/g)?.[0]
				.split(", ")
				.map(Number),
		}))
		.map((insight) =>
			insight.content && insight.sources?.length
				? {
						content: insight.content,
						sources: insight.sources,
				  }
				: undefined
		)
		.filter(Boolean)
		.map((insight) => ({
			type:
				concatenatedInsights[(insight.sources[0] ?? 1) - 1]?.type ===
				"weakness"
					? ("weakness" as const)
					: ("strength" as const),
			content: insight.content,
			sources: Object.entries(
				insight.sources
					.map(
						(sourceIndex) =>
							concatenatedInsights[sourceIndex - 1]?.sources
					)
					.filter(Boolean)
					.flat()
					.reduce(
						(prev, cur) => ({
							...prev,
							[cur.assignmentId]:
								prev[cur.assignmentId]?.includes(-1) ||
								cur.paragraphs.includes(-1)
									? [-1]
									: (prev[cur.assignmentId] ?? []).concat(
											cur.paragraphs
									  ),
						}),
						{} as Record<string, number[]>
					)
			).map(([assignmentId, paragraphs]) => ({
				assignmentId,
				paragraphs,
			})),
		}))

	await Promise.all([
		...unsyncedInsights.map((insight) =>
			Insight({
				courseId,
				assignmentId: insight.assignmentId,
				studentEmail,
			}).updateSynced({ insights: insight.insights })
		),
		StudentInsight({ courseId, studentEmail }).upsert({
			insights: mergedInsights,
		}),
	])
}

export default generateStudentInsights