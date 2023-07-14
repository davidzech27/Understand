import fetchOpenAI from "./fetchOpenAI"

export default function getFollowUp({
	feedback,
	followUps,
	revision,
	instructions,
	submission,
	synopsis,
	commentary,
	specificFeedback,
	generalFeedback,
	onContent,
	onFinish,
}: {
	feedback: string
	followUps: string[]
	revision:
		| {
				paragraph?: number
				content: string
		  }
		| undefined
	instructions: string
	submission: string
	synopsis: string
	commentary: string
	specificFeedback: string
	generalFeedback: string
	onContent: (content: string) => void
	onFinish: ({}: {
		model: string
		temperature: number
		presencePenalty: number
		frequencyPenalty: number
		messages: {
			role: "user" | "system" | "assistant"
			content: string
		}[]
	}) => void
}) {
	if (revision !== undefined) {
		followUps = structuredClone(followUps)

		followUps[
			followUps.length - 1
		] = `The student has made a revision to their work:
${
	revision.paragraph !== undefined
		? `<paragraph-number>${revision.paragraph}</paragraph-number>\n`
		: ""
}<revision>
${revision.content}
</revision>

Here's what they said:
${followUps[followUps.length - 1]}`
	}

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
${instructions}
</assignment-prompt>

The following is a high school student's progress on that assignment:
<student-progress>
${submission}
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
${feedback}
</part-of-feedback>

You will respond to the student in a way that helps them understand the subject matter at a deeper, more nuanced level. Make use of the Socratic method to lead the student in the right direction. Generalize to larger contexts outside the class in interesting ways, or walk the student through a concrete example of a mental process they could take to improve their work. Never give any ideas or content away to the student. Prioritize unconventional advice, and avoid platitudes. Frequently reference the student's work. Be conversational but very concise.

Here's what they said:
${followUps[0]}`,
				},
				...followUps.slice(1).map((followUp, index) => ({
					role:
						index % 2 === 0
							? ("assistant" as const)
							: ("user" as const),
					content: followUp,
				})),
			],
			model: "gpt-4-0613" as const,
			temperature: 0.25,
			presencePenalty: 0.5,
			frequencyPenalty: 0.75,
		}

	fetchOpenAI({
		messages,
		model,
		temperature,
		presencePenalty,
		frequencyPenalty,
		onContent,
		onFinish: (content) => {
			onFinish({
				messages: messages.concat({
					role: "assistant",
					content,
				}),
				model,
				temperature,
				presencePenalty,
				frequencyPenalty,
			})
		},
	})
}
