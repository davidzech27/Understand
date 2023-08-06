import { type Feedback } from "~/data/Feedback"
import fetchOpenAI from "./fetchOpenAI"

export default function getFollowUp({
	paragraph,
	sentence,
	feedback,
	assignmentInstructions,
	unrevisedSubmissionText,
	onContent,
	onFinish,
}: {
	paragraph: number | undefined
	sentence: number | undefined
	feedback: Feedback
	assignmentInstructions: string
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

	const lines = feedback.rawResponse.split("\n")

	const headerLineIndex = {
		commentary: lines.findIndex(
			(line) => line.search(/^Commentary:?\s*$/) !== -1
		),
		specificFeedback: lines.findIndex(
			(line) => line.search(/^Specific Feedback:?\s*$/) !== -1
		),
		generalFeedback: lines.findIndex(
			(line) => line.search(/^General Feedback:?\s*$/) !== -1
		),
	}

	const synopsis = lines
		.slice(1, headerLineIndex.commentary)
		.join("\n")
		.trim()

	const commentary = lines
		.slice(headerLineIndex.commentary + 1, headerLineIndex.specificFeedback)
		.join("\n")
		.trim()

	const specificFeedback = lines
		.slice(
			headerLineIndex.specificFeedback + 1,
			headerLineIndex.generalFeedback
		)
		.join("\n")
		.trim()

	const generalFeedback = lines
		.slice(headerLineIndex.generalFeedback + 1)
		.join("\n")
		.trim()

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
					content: `The following is a prompt for an assignment in a high school course:
<assignment-prompt>
${assignmentInstructions}
</assignment-prompt>

The following is a high school student's progress on that assignment:
<student-progress>
${unrevisedSubmissionText}
</student-progress>

You have just analyzed this student's work and given them feedback on it:
<analysis>
Synopsis: ${synopsis}

Commentary:
${commentary}
</analysis>

<feedback-on-specific-parts-of-work>
${specificFeedback}
</feedback-on-specific-parts-of-work>

<feedback-on-entire-work>
${generalFeedback}
</feedback-on-entire-work>

The student responded to the following part of your feedback.
<part-of-feedback>
${followUpFeedback.content}
</part-of-feedback>

You will respond to the student in a way that helps them understand the subject matter at a deeper, more nuanced level. Make use of the Socratic method to lead the student in the right direction. Generalize to larger contexts outside the class in interesting ways, or walk the student through a concrete example of a mental process they could take to improve their work. Never give any ideas or content away to the student. Prioritize unconventional advice, and avoid platitudes. Frequently reference the student's work. Be conversational but very concise.

Now, here they are.`,
				},
				...followUpFeedback.followUps
					.map((followUp) => [
						followUp.revisions[0] !== undefined && {
							role: "system" as const,
							content: `The student has made ${
								followUp.revisions.length === 1
									? "a revision"
									: "revisions"
							} to their work:

${followUp.revisions
	.map(
		(revision) =>
			`${
				paragraph === undefined
					? `<paragraph-number>${revision.paragraph}</paragraph-number>\n`
					: ""
			}<sentence-number>${revision.sentence}</sentence-number>
${
	revision.oldContent !== "" && revision.newContent !== ""
		? `<old-content>${revision.oldContent}</old-content>
<new-content>${revision.newContent}</new-content>`
		: revision.oldContent !== ""
		? `<removed-content>${revision.oldContent}</removed-content>`
		: revision.newContent !== ""
		? `<added-content>${revision.newContent}</added-content>`
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
		onContent,
		onFinish: (content) => {
			onFinish({
				rawResponse: content,
			})
		},
	})
}
