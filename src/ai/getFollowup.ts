import { type Feedback } from "~/data/Feedback"
import fetchOpenAI from "./fetchOpenAI"

export default function getFollowUp({
	paragraph,
	sentence,
	feedback,
	assignmentTitle,
	assignmentInstructions,
	studentName,
	unrevisedSubmissionText,
	onContent,
	onFinish,
}: {
	paragraph: number | undefined
	sentence: number | undefined
	feedback: Feedback
	assignmentTitle: string
	assignmentInstructions: string
	studentName: string
	unrevisedSubmissionText: string
	onContent: (content: string) => void
	onFinish: ({ rawResponse }: { rawResponse: string }) => void
}) {
	const followUpFeedback = feedback.list.find(
		(feedbackItem) =>
			feedbackItem.paragraph === paragraph &&
			feedbackItem.sentence === sentence
	)

	if (followUpFeedback === undefined) return

	const feedbackLines = feedback.rawResponse.split("\n")

	const specificFeedbackHeaderLineIndex = feedbackLines.findIndex((line) =>
		line.toLowerCase().startsWith("specific feedback")
	)

	const analysisString = feedbackLines
		.slice(0, specificFeedbackHeaderLineIndex)
		.join("\n")

	const feedbackString = feedbackLines
		.slice(specificFeedbackHeaderLineIndex)
		.join("\n")

	const { messages, model, temperature, presencePenalty, frequencyPenalty } =
		{
			messages: [
				{
					role: "system" as "user" | "system" | "assistant",
					content:
						"You are an uncommonly creative tutor for high school students.",
				},
				{
					role: "user" as "user" | "system" | "assistant",
					content: `You have just given a high school student named ${studentName} feedback on an assignment titled "${assignmentTitle}". The following is information about the assignment, ${studentName}'s work, your analysis of ${studentName}'s work, and your feedback on it:

Assignment prompt: """${assignmentInstructions}"""
${studentName}'s work: """${unrevisedSubmissionText}"""
Analysis: """${analysisString}"""
Feedback: """${feedbackString}"""

${studentName} responded to the following part of your feedback: """${followUpFeedback.content}"""

You will respond to ${studentName} in a way that helps them understand the subject matter at a deeper, more nuanced level, while frequently referencing their work. Do not prescribe any particular solutions to ${studentName}; instead, make use of the Socratic method to lead ${studentName} in the right direction, generalize to the real world in interesting ways, or walk ${studentName} through an interesting example of a mental process they could take to improve their work. Prioritize unconventional advice, and avoid platitudes. Be conversational but very succinct.

Now, here they are.`,
				},
				...followUpFeedback.followUps
					.map((followUp) => [
						followUp.revisions[0] !== undefined && {
							role: "system" as const,
							content: `${studentName} has made ${
								followUp.revisions.length === 1
									? "a revision"
									: "revisions"
							} to their work:

${followUp.revisions
	.map(
		(revision) =>
			`${
				paragraph === undefined
					? `Paragraph number: ${revision.paragraph}\n`
					: ""
			}Sentence number: ${revision.sentence}
${
	revision.oldContent !== "" && revision.newContent !== ""
		? `Old content: """${revision.oldContent}"""
New content: """${revision.newContent}"""`
		: revision.oldContent !== ""
		? `Removed content: """${revision.oldContent}"""`
		: revision.newContent !== ""
		? `Added content: """${revision.newContent}"""`
		: ""
}`
	)
	.join("\n\n")}`,
						},
						{
							role: "user" as const,
							content: followUp.userMessage,
						},
						followUp.aiMessage !== "" && {
							role: "assistant" as const,
							content: followUp.aiMessage,
						},
					])
					.flat()
					.filter(Boolean),
			],
			model: "gpt-4-0613" as const,
			temperature: 0.25,
			presencePenalty: 0.5,
			frequencyPenalty: 0.75,
		}

	console.info(messages.map(({ content }) => content).join("\n\n\n\n"))

	fetchOpenAI({
		messages,
		model,
		temperature,
		presencePenalty,
		frequencyPenalty,
		reason: "followUp",
		onContent,
		onFinish: (content) => {
			onFinish({
				rawResponse: content,
			})
		},
	})
}
