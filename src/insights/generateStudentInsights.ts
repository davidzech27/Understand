import { and, eq } from "drizzle-orm"

import db from "~/db/db"
import User from "~/data/User"
import getCompletion from "~/ai/getCompletion"
import Feedback from "~/data/Feedback"

const generateStudentInsights = async ({
	courseId,
	studentEmail,
}: {
	courseId: string
	studentEmail: string
}) => {
	const [previousStudentInsights, unsyncedInsights] = await Promise.all([
		User({ email: studentEmail }).insights({ courseId }),
		User({ email: studentEmail }).unsyncedInsights({ courseId }),
	])

	const unsyncedAssignmentIdSet = new Set(
		unsyncedInsights.map((insight) => insight.assignmentId)
	)

	const previousStudentInsightsWithoutUnsynced = previousStudentInsights
		?.map((insight) => ({
			...insight,
			sources: insight.sources.filter(
				(source) => !unsyncedAssignmentIdSet.has(source.assignmentId) // consider removing student insight entirely if any of its sources are unsynced. however, then you'd have to fetch all the insights on these student insights, not just the unsynced ones
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
			content: `The following is a list of insights regarding the strengths/weaknesses of a student across various assignments:${
				concatenatedInsights
					?.map(
						(insight, index) =>
							`\n\n${index + 1}. ${insight.content}`
					)
					.join("") ?? ""
			}

Some of the above insights may be similar in meaning. Rewrite them while expressing them in the context of the student's understanding of the class in general, while keeping every detail. Use the following format:
Title: {a title}
Content: {the rewritten insight}
Sources: {the number(s) corresponding the original insight(s) that formed this insight, using a comma-separated list if necessary}

Begin.`,
		},
	]

	const mergedInsightsCompletion = await getCompletion({
		messages: mergedInsightsPromptMessages,
		model: "gpt-4-0613",
		temperature: 0,
		presencePenalty: 0.0,
		frequencyPenalty: 0.0,
	})

	console.info(
		"Merged insight prompt messages: ",
		mergedInsightsPromptMessages
	)

	console.info("Merged insight completion: ", mergedInsightsCompletion)

	const mergedInsights = mergedInsightsCompletion
		.split("\n\n")
		.map((insight) => ({
			type: insight.match(/(?<=^Title:[ ]).+/g)?.[0],
			content: insight.match(/(?<=\nContent:[ ]).+/g)?.[0],
			sources: insight
				.match(/(?<=\nSources:[ ]).+/g)?.[0]
				.split(/,[ ]*/)
				.map(Number),
		}))
		.map((insight) =>
			insight.type && insight.content && insight.sources?.length
				? {
						type:
							insight.type[0] +
							insight.type.slice(1).toLowerCase(),
						content: insight.content,
						sources: insight.sources,
				  }
				: undefined
		)
		.filter(Boolean)
		.map((insight) => ({
			type: insight.type,
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
			Feedback({
				courseId,
				assignmentId: insight.assignmentId,
				userEmail: studentEmail,
				givenAt: insight.givenAt,
			}).updateSynced({ insights: insight.insights })
		),
		User({ email: studentEmail }).upsertInsights({
			courseId,
			insights: mergedInsights,
		}),
	])
}

export default generateStudentInsights
