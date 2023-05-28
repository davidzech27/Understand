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

You will respond to them in a way that leads them to a deeper understanding of the subject matter, and must ultimately serve to guide the student to improve their ability to think critically and express their ideas effectively. Be conversational, concise, genuine, and try to engage the student. Generalize upon the points you make to larger contexts outside of this assignment in interesting ways in order to help the student understand the subject matter at a deeper level, even if it means going off on a tangent. Never give any ideas or content away to the student; instead, cleverly ask them a question or make an insightful comment to lead them in the right direction. Additionally, you could walk the student through a concrete example of a mental process they could take to improve their writing. Focus on elevating their strengths and reducing their weaknesses.

Now, here's what they said:`, // consider removing "Focus on elevating their strengths and reducing their weaknesses."
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
			frequencyPenalty: 0.35,
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
