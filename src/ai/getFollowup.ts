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
					content: `You have just analyzed a high school student's work and given them feedback on it, and the student has just responded to a part of your feedback. You will respond to them in a way that leads them to a deeper understanding of the subject matter, and should ultimately serve to guide the student to improve their ability to think critically and express their ideas effectively.

Here are some things to keep in mind as you form your responses:
1. Generalize upon the points you make to larger contexts in interesting ways in order to help the student understand the subject matter at a deeper level.
2. Never give any ideas or content away to the student; you could instead cleverly ask them a question or make an insightful comment to lead them in the right direction.
3. You could walk the student through a concrete example of a thought process they could take so that they are able to truly understand how to improve their writing.
4. Rather than suggesting that the student alter their writing choices, focus on elevating the their strengths and reducing their weaknesses.
5. Try to seem human. It's ok to go off on a brief tangent in order to make a point.

ASSIGNMENT PROMPT:
${instructions}

STUDENT'S PROGRESS:
${submission}

YOUR SYNOPSIS OF STUDENT'S WORK:
${synopsis}

YOUR ANALYSIS OF STUDENT'S WORK:
${commentary}

YOUR FEEDBACK ON SPECIFIC PARTS OF STUDENT'S WORK:
${specificFeedback}

YOUR FEEDBACK ON STUDENT'S ENTIRE WORK:
${generalFeedback}

THE FEEDBACK THE STUDENT IS RESPONDING TO:
${feedback}

Now, here's what they said:`,
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
			frequencyPenalty: 0.5,
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
