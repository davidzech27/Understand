import breakIntoSentences from "~/utils/breakIntoSentences"
import fetchOpenAI from "./fetchOpenAI"

// old comments, may not be relevant anymore:
// specific feedback needs to ask a question or make an insightful comment to guide the student to a deeper understanding of the subject matter.
// it also needs to reference other parts of the student's work so that no part of it is ignored
// general feedback isn't comprehensive enough
// sometimes doesn't see the big picture. big problem with GPTs in general
// should give student options for how to revise their work, and not prescribe its own. suggested solutions are too specific
// currently feedback is too certain of itself and not varied. not very interesting feedback and doesn't go beyond the absolute surface level when providing reasoning.
// needs to be more holistic. needs to understand that to improve one's writing, you must focus on elevating their strengths and reducing their weaknesses. don't suggest an improvement that has no bearing on the student's existing work.
// perhaps being wrong isn't the worst thing, as it could train students to defend their essay. shouldn't be a feature though
export default async function getFeedback({
	instructions,
	submission,
	studentName,
	courseName,
	onSpecificContent,
	onGeneralContent,
	onFinish,
}: {
	instructions: string
	submission: string
	studentName: string
	courseName: string
	onSpecificContent: ({}: {
		content: string
		paragraph: number
		sentence: number
	}) => void
	onGeneralContent: (content: string) => void
	onFinish: ({}: {
		model: string
		temperature: number
		presencePenalty: number
		frequencyPenalty: number
		messages: {
			role: "user" | "system" | "assistant"
			content: string
		}[]
		rawResponse: string
		synopsis: string
		commentary: string
		specificFeedback: string
		generalFeedback: string
	}) => void
}) {
	let lastParagraphNumber = undefined as number | undefined
	let lastSentenceNumber = undefined as number | undefined

	let previousFeedbackLength = undefined as number | undefined

	const { messages, model, temperature, presencePenalty, frequencyPenalty } =
		{
			messages: [
				{
					role: "system" as "system" | "user" | "assistant",
					content:
						"You're an uncommonly creative tutor that provides holistic, in-depth feedback on high school students' work.",
				},
				{
					role: "user" as "system" | "user" | "assistant",

					content: `The following is a prompt for an assignment in a high school class:
<assignment-prompt>
${instructions}
</assignment-prompt>

The following is a high school student's progress on that assignment:
<student-progress>
${submission}
</student-progress>

Here is some extra information:
<student-progress-word-count>${
						submission
							.split(/\s/)
							.filter((word) => word.trim() !== "").length
					}</student-progress-word-count>
<student-progress-sentence-counts>
${submission
	.split(/(\n|\t)/)
	.filter((line) => line.indexOf(".") !== line.lastIndexOf("."))
	.map(
		(paragraph, paragraphNumber) =>
			`<paragraph-${paragraphNumber + 1}>${
				breakIntoSentences(paragraph).length
			}</paragraph-${paragraphNumber + 1}>`
	)
	.join("\n")}
</student-progress-sentence-counts>
<student-name>${studentName}</student-name>
<class-name>${courseName}</class-name>

You'll serve as a tutor for the high school student, providing them with holistic and in-depth feedback on their work, serving to guide the student to improve their ability to express their ideas effectively and to a deeper understanding of critical thinking. The process by which you will accomplish this will consist of four steps:

Synopsis
Construct a very thorough synopsis of the student's work.

Commentary
Identify one area where the student demonstrates their strengths or unique character as a writer and the three areas where the student could most improve the communication of their ideas or their depth of thought. For each area of commentary, ask a question that the student may have about the commentary, then answer it with direct references to the student's work.

Specific Feedback
Provide many areas of feedback pertaining to the segments of the student's work that your commentary most applies to. In each area of feedback, frequently reference the student's work and provide in-depth reasoning in order to best help them understand how to improve their work. Do not prescribe any particular solution to the student; instead, cleverly ask them a question or make an insightful comment to lead them in the right direction. Unless required by the assignment prompt, do not suggest that the student increase the scope of their work or that they alter their stylistic writing choices. Each area of specific feedback should use the following format:
Paragraph number: {paragraph number of the segment of the student's work pertaining to the feedback}
Sentence number: {sentence number of the segment of the student's work pertaining to the feedback, or -1 if the feedback applies to the entire paragraph}
Feedback: {the feedback to the student}

General Feedback
Provide the student with thoughtful, engaging, and actionable feedback on their work as a whole. Begin by acknowledging an interesting strength or unique characteristic of the student. In the next two paragraphs, delve deeply into the two biggest areas for improvement in the student's work. End on an appropriately positive, and perhaps creative, note.

Begin.`,
				},
			],
			model: "gpt-4-0613" as const,
			temperature: 0,
			presencePenalty: 0.25, // setting this and the one below made a huge difference. my theory is that it decreases the model's bias to take on a similar writing style to that of the prompt, increasing its likelihood to follow the instructions and not just attempt to match them in style. consider tweaking these further
			frequencyPenalty: 0.25,
		}

	console.debug(messages.map(({ content }) => content).join("\n\n\n\n"))

	fetchOpenAI({
		messages,
		model,
		temperature,
		presencePenalty,
		frequencyPenalty,
		onContent: (content) => {
			const generalFeedbackHeaderIndex = content.search(
				/\nGeneral Feedback:?\n+.+/
			)

			if (generalFeedbackHeaderIndex !== -1) {
				onGeneralContent(
					content.slice(
						content.indexOf("\n", generalFeedbackHeaderIndex + 1) +
							1
					)
				)
			} else if (content.search(/\nSpecific Feedback:?\n/) !== -1) {
				const feedback = content
					.match(/(?<=\nFeedback[ ]*:[ ]*).+/g)
					?.at(-1)

				if (feedback !== undefined) {
					if (
						previousFeedbackLength === undefined ||
						previousFeedbackLength > feedback.length
					) {
						lastParagraphNumber = Number(
							content
								.match(
									/(?<=\n(\d\.[ ]*)?[ ]*Paragraph( number)?[ ]*:?[ ]*)\d+/g
								)
								?.at(-1)
						)

						if (lastParagraphNumber !== lastParagraphNumber)
							lastParagraphNumber = undefined

						lastSentenceNumber = Number(
							content
								.match(
									/(?<=\n[ ]*Sentence( number)?[ ]*:?[ ]*)-?\d+/g
								)
								?.at(-1)
						)

						if (lastSentenceNumber !== lastSentenceNumber)
							lastSentenceNumber = undefined
					}

					previousFeedbackLength = feedback.length

					if (
						lastParagraphNumber === undefined ||
						lastSentenceNumber === undefined
					) {
						console.error(
							"This shouldn't happen, as lastParagraphNumber and lastSentenceNumber should be defined before feedback is streamed",
							{ lastParagraphNumber, lastSentenceNumber }
						)
					} else {
						onSpecificContent({
							content: feedback,
							paragraph: lastParagraphNumber,
							sentence: lastSentenceNumber,
						})
					}
				}
			}
		},
		onFinish: (content) => {
			const lines = content.split("\n")

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

			onFinish({
				messages: messages.concat({
					role: "user",
					content,
				}),
				model,
				temperature,
				presencePenalty,
				frequencyPenalty,
				rawResponse: content,
				synopsis: lines
					.slice(1, headerLineIndex.commentary)
					.join("\n")
					.trim(),
				commentary: lines
					.slice(
						headerLineIndex.commentary + 1,
						headerLineIndex.specificFeedback
					)
					.join("\n")
					.trim(),
				specificFeedback: lines
					.slice(
						headerLineIndex.specificFeedback + 1,
						headerLineIndex.generalFeedback
					)
					.join("\n")
					.trim(),
				generalFeedback: lines
					.slice(headerLineIndex.generalFeedback + 1)
					.join("\n")
					.trim(),
			})
		},
	})
}
