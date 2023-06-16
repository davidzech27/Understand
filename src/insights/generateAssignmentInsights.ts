import { and, eq } from "drizzle-orm"

import db from "~/db/db"
import { insight } from "~/db/schema"
import AssignmentInsight from "~/data/AssignmentInsight"
import Insight, { insightsSchema } from "~/data/Insight"
import getCompletion from "~/ai/getCompletion"

const generateAssignmentInsights = async ({
	courseId,
	assignmentId,
}: {
	courseId: string
	assignmentId: string
}) => {
	const [previousAssignmentInsights, unsyncedInsights] = await Promise.all([
		AssignmentInsight({ courseId, assignmentId }).get(),
		db
			.select({
				studentEmail: insight.studentEmail,
				insights: insight.insights,
			})
			.from(insight)
			.where(
				and(
					eq(insight.courseId, courseId),
					eq(insight.assignmentId, assignmentId),
					eq(insight.synced, false)
				)
			)
			.then((insights) =>
				insights.map((insight) => ({
					studentEmail: insight.studentEmail,
					insights: insightsSchema.parse(insight.insights),
				}))
			),
	])

	const unsyncedStudentEmailSet = new Set(
		unsyncedInsights.map((insight) => insight.studentEmail)
	)

	const previousAssignmentInsightsWithoutUnsynced = previousAssignmentInsights
		?.map((insight) => ({
			...insight,
			sources: insight.sources.filter(
				(source) => !unsyncedStudentEmailSet.has(source.studentEmail)
			),
		}))
		.filter((insight) => insight.sources.length > 0)

	const concatenatedInsights = (
		previousAssignmentInsightsWithoutUnsynced ?? []
	).concat(
		unsyncedInsights
			.map((studentInsights) =>
				studentInsights.insights.map((insight) => ({
					type: insight.type,
					content: insight.content,
					sources: [
						{
							studentEmail: studentInsights.studentEmail,
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
			content: `The following is a list of insights regarding the strengths/weaknesses of students in a class on a particular assignment:${
				concatenatedInsights
					?.map(
						(insight, index) =>
							`\n\n${index + 1}. ${insight.content}`
					)
					.join("") ?? ""
			}

Some of the above insights may express similar things about the strengths/weaknesses of the class on the assignment, and could be combined to form longer insights. Additionally, these insights should be expressed in the context of the students in the class in general. Rewrite the above insights with this in mind. Do not mix strengths and weaknesses. Use the following format:
Content: {the rewritten insight}
Sources: {the number(s) corresponding the original insight(s) that formed this insight, using a comma-separated list if necessary}

Begin.`,
		},
	]

	const mergedInsightsCompletion = await getCompletion({
		messages: mergedInsightsPromptMessages,
		model: "gpt-4-0613",
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
							[cur.studentEmail]:
								prev[cur.studentEmail]?.includes(-1) ||
								cur.paragraphs.includes(-1)
									? [-1]
									: (prev[cur.studentEmail] ?? []).concat(
											cur.paragraphs
									  ),
						}),
						{} as Record<string, number[]>
					)
			).map(([studentEmail, paragraphs]) => ({
				studentEmail,
				paragraphs,
			})),
		}))

	await Promise.all([
		...unsyncedInsights.map((insight) =>
			Insight({
				courseId,
				assignmentId,
				studentEmail: insight.studentEmail,
			}).updateSynced({ insights: insight.insights })
		),
		AssignmentInsight({ courseId, assignmentId }).upsert({
			insights: mergedInsights,
		}),
	])
}

export default generateAssignmentInsights
