import { Logger } from "next-axiom"

import Assignment from "~/data/Assignment"
import getCompletion from "~/ai/getCompletion"
import Feedback from "~/data/Feedback"
import Course from "~/data/Course"

export default async function generateAssignmentInsights({
	courseId,
	assignmentId,
}: {
	courseId: string
	assignmentId: string
}) {
	const log = new Logger()

	const [previousAssignmentInsights, unsyncedFeedbackInsights, assignment] =
		await Promise.all([
			Assignment({ courseId, assignmentId }).insights(),
			Assignment({ courseId, assignmentId }).unsyncedFeedbackInsights(),
			Assignment({ courseId, assignmentId }).get(),
		])

	if (assignment === undefined) {
		log.error("Assignment could not be found for insight generation", {
			courseId,
			assignmentId,
		})

		return
	}

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
		previousAssignmentInsightsWithoutUnsynced?.map(
			({ type, content, sources }) => ({ type, content, sources })
		) ?? []
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
			content: `The following are strengths and weaknesses of some students on an assignment titled ${
				assignment.title
			}:

${concatenatedInsights
	?.map(
		(insight, index) => `Number: ${index + 1}
Type: ${insight.type}
Student emails: ${insight.sources
			.map(({ studentEmail }) => studentEmail)
			.join(", ")}
Content: ${insight.content}`
	)
	.join("\n\n")}

Rewrite the above strengths and weaknesses, combining ones that are identical or nearly identical, using the following format:
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

	log.info("Assignment insights merged", {
		courseId,
		assignmentId,
		messages: mergedInsightsPromptMessages
			.map(({ content }) => content)
			.concat(mergedInsightsCompletion),
	})

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
		Course({ id: courseId }).increaseCost({
			insights: cost,
		}),
	])
}
