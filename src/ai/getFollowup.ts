import fetchOpenAIStream from "./fetchOpenAIStream"

const getFollowUp = ({
	feedback,
	followUps,
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
}) => {
	const { messages, model, temperature, presencePenalty, frequencyPenalty } =
		{
			messages: [
				{
					role: "system" as "user" | "system" | "assistant",
					content:
						"You are an uncommonly creative tutor for high school students that works hard to guide students to think critically and communicate their ideas effectively.",
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

The student has just responded to the following part of your feedback.
<part-of-feedback>
${feedback}
</part-of-feedback>

You will respond to the student in a way that helps them understand at a deeper level how they should improve their work. Make use of the Socratic method to lead the student in the right direction. Acknowledge what is already present in the student's work. Generalize to larger contexts outside the class in interesting ways in order to help the student understand the subject matter at a deeper level. Never give any ideas or content away to the student. Be entertaining but very concise.`,
				},
				...followUps.map((followUp, index) => ({
					role:
						index % 2 === 0
							? ("user" as const)
							: ("assistant" as const),
					content: followUp,
				})),
			],
			model: "gpt-4" as const,
			temperature: 0.25,
			presencePenalty: 0.5,
			frequencyPenalty: 0.75,
		}

	fetchOpenAIStream({
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

export default getFollowUp
