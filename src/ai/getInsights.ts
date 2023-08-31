import { type Feedback } from "~/data/Feedback"
import fetchOpenAI from "./fetchOpenAI"

export default async function getInsights({
	feedback,
	assignmentTitle,
	assignmentInstructions,
	studentName,
	submissionText,
}: {
	feedback: Feedback
	assignmentTitle: string
	assignmentInstructions: string
	studentName: string
	submissionText: string
}) {
	const feedbackLines = feedback.rawResponse.split("\n")

	const specificFeedbackHeaderLineIndex = feedbackLines.findIndex((line) =>
		line.toLowerCase().startsWith("specific feedback")
	)

	const feedbackString = feedbackLines
		.slice(specificFeedbackHeaderLineIndex)
		.join("\n")

	const messages = [
		{
			role: "system" as const,
			content:
				"You are an uncommonly creative and nuanced teacher's assistant.",
		},
		{
			role: "user" as const,
			content: `A high school student named ${studentName} received feedback on an assignment titled "${assignmentTitle}". The following is information about the assignment, ${studentName}'s work, and the feedback on it:

Assignment prompt: """${assignmentInstructions}"""
${studentName}'s work: """${submissionText}"""
Feedback: """${feedbackString}"""

Provide ${studentName}'s teacher with a few nuanced remarks regarding their demonstrated understanding using the following format:
Type: {strength / weakness}
Paragraph number: {paragraph number for every paragraph where the strength/weakness could be found, using a comma-separated list if necessary, or -1 to represent the student's entire work}
Content: {a nuanced remark regarding ${studentName}'s understanding. If it is a weakness, hypothesize as to what may have caused this weakness}

Begin.`,
		},
	]

	try {
		const completion = await new Promise<string>((res, rej) =>
			fetchOpenAI({
				messages,
				model: "gpt-4-0613",
				presencePenalty: 0.25,
				frequencyPenalty: 0.25,
				temperature: 0,
				reason: "insights",
				onContent: () => {},
				onRateLimit: () => rej(),
				onFinish: res,
			})
		)

		console.info(
			messages
				.map(({ content }) => content)
				.concat(completion)
				.join("\n\n\n\n")
		)

		return {
			insights: completion
				.split("\n\n")
				.map((insight) => ({
					type:
						insight
							.match(/(?<=^(Insights:[ ]+)?Type:[ ]).+/g)?.[0]
							.toLowerCase() === "strength"
							? ("strength" as const)
							: ("weakness" as const),
					paragraphs: insight
						.match(/(?<=\nParagraph number:[ ]).+/g)?.[0]
						.split(/,[ ]*/)
						.map(Number),
					content: insight.match(/(?<=\nContent:[ ]).+/g)?.[0],
				}))
				.map((insight) =>
					insight.paragraphs && insight.content
						? {
								type: insight.type,
								paragraphs: insight.paragraphs,
								content: insight.content,
						  }
						: undefined
				)
				.filter(Boolean),
		}
	} catch (_) {
		return { insights: [] }
	}
}
