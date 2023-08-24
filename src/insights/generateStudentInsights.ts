import User from "~/data/User"
import getCompletion from "~/ai/getCompletion"
import Feedback from "~/data/Feedback"
import Course from "~/data/Course"

export default async function generateStudentInsights({
	courseId,
	studentEmail,
}: {
	courseId: string
	studentEmail: string
}) {
	const [
		previousStudentInsights,
		unsyncedFeedbackInsights,
		student,
		assignments,
	] = await Promise.all([
		User({ email: studentEmail }).insights({ courseId }),
		User({ email: studentEmail }).unsyncedFeedbackInsights({
			courseId,
		}),
		User({ email: studentEmail }).get(),
		Course({ id: courseId }).assignments(),
	])

	if (student === undefined) {
		console.error("Student could not be found", {
			studentEmail,
		})

		return
	}

	const unsyncedAssignmentIdSet = new Set(
		unsyncedFeedbackInsights.map((insight) => insight.assignmentId)
	)

	const previousStudentInsightsWithoutUnsynced = previousStudentInsights
		?.map((insight) => ({
			...insight,
			sources: insight.sources.filter(
				(source) => !unsyncedAssignmentIdSet.has(source.assignmentId) // consider removing student insight entirely if any of its sources are unsynced. however, then you'd have to fetch all the insights on these student insights, not just the unsynced ones
			),
		}))
		.filter((insight) => insight.sources.length !== 0)

	const concatenatedInsights = (
		previousStudentInsightsWithoutUnsynced?.map(
			({ type, content, sources }) => ({ type, content, sources })
		) ?? []
	).concat(
		unsyncedFeedbackInsights
			.sort(
				(feedback1, feedback2) =>
					feedback1.givenAt.valueOf() - feedback2.givenAt.valueOf()
			)
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

	const assignmentIdToTitleMap = new Map(
		assignments.map(({ assignmentId, title }) => [assignmentId, title])
	)

	const mergedInsightsPromptMessages = [
		{
			role: "system" as const,
			content: "You are a helpful teacher's assistant.",
		},
		{
			role: "user" as const,
			content: `The following are strengths and weaknesses of a student named ${
				student.name
			} across various assignments:

${concatenatedInsights
	?.map(
		(insight, index) => `Number: ${index + 1}
Type: ${insight.type}
Assignment titles: ${insight.sources
			.map(({ assignmentId }) => assignmentIdToTitleMap.get(assignmentId))
			.filter(Boolean)
			.join(", ")}
Content: ${insight.content}`
	)
	.join("\n\n")}

Given that these are in chronological order and may express ${
				student.name
			}'s progress over time, rewrite the above strengths and weaknesses, combining ones that are identical or nearly identical, using the following format:
Title: {short title}
Type: {strength / weakness}
Content: {insight content}
Sources: {number corresponding the original strength / weakness that formed this insight, using a comma-separated list if there are multiple}

Begin.`,
		},
	]

	const { completion: mergedInsightsCompletion, cost } = await getCompletion({
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
			title: insight.match(/(?<=^Title:[ ]).+/g)?.[0],
			type: insight.match(/(?<=\nType:[ ]).+/g)?.[0].toLowerCase(),
			content: insight.match(/(?<=\nContent:[ ]).+/g)?.[0],
			sources: insight
				.match(/(?<=\nSources:[ ]).+/g)?.[0]
				.split(/,[ ]*/)
				.map(Number),
		}))
		.map((insight) =>
			insight.title &&
			insight.content &&
			(insight.type === "strength" || insight.type === "weakness") &&
			insight.sources?.length
				? {
						title: insight.title,
						type: insight.type as "strength" | "weakness",
						content: insight.content,
						sources: insight.sources,
				  }
				: undefined
		)
		.filter(Boolean)
		.map((insight) => ({
			title: insight.title,
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
		...unsyncedFeedbackInsights.map((insight) =>
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
		Course({ id: courseId }).increaseCost({
			insights: cost,
		}),
	])
}
