import Assignment from "~/data/Assignment"
import getCompletion from "~/ai/getCompletion"
import Feedback from "~/data/Feedback"

export default async function generateAssignmentInsights({
	courseId,
	assignmentId,
}: {
	courseId: string
	assignmentId: string
}) {
	const [previousAssignmentInsights, unsyncedFeedbackInsights] =
		await Promise.all([
			Assignment({ courseId, assignmentId }).insights(),
			Assignment({ courseId, assignmentId }).unsyncedFeedbackInsights(),
		])

	const unsyncedStudentEmailSet = new Set(
		unsyncedFeedbackInsights.map((insight) => insight.studentEmail)
	)

	const previousAssignmentInsightsWithoutUnsynced = previousAssignmentInsights
		?.map((insight) => ({
			...insight,
			sources: insight.sources.filter(
				(source) => !unsyncedStudentEmailSet.has(source.studentEmail)
			),
		}))
		.filter((insight) => insight.sources.length !== 0)

	const concatenatedInsights = (
		previousAssignmentInsightsWithoutUnsynced ?? []
	).concat(
		unsyncedFeedbackInsights
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

Some of the above insights may express nearly identical things about the strengths/weaknesses of the class on the assignment, and could be combined to form longer insights. Additionally, these insights should be expressed in the context of the students in the class in general. Rewrite the above insights with this in mind. Do not mix strengths and weaknesses. Use the following format:
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
				.split(/,[ ]*/)
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
				concatenatedInsights[(insight.sources.at(-1) ?? 1) - 1]
					?.type === "weakness"
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
		...unsyncedFeedbackInsights.map((insight) =>
			Feedback({
				courseId,
				assignmentId,
				userEmail: insight.studentEmail,
				givenAt: insight.givenAt,
			}).updateSynced({ insights: insight.insights })
		),
		Assignment({ courseId, assignmentId }).upsertInsights({
			insights: mergedInsights,
		}),
	])
}
