import breakIntoSentences from "~/utils/breakIntoSentences"
import fetchOpenAIStream from "./fetchOpenAIStream"

// specific feedback needs to ask a question or make an insightful comment to guide the student to a deeper understanding of the subject matter.
// it also needs to reference other parts of the student's work so that no part of it is ignored
// general feedback isn't comprehensive enough

// should give student options for how to revise their work, and not prescribe its own

// old comments, may not be relevant anymore:
// currently feedback is too certain of itself and not varied. not very interesting feedback and doesn't go beyond the absolute surface level when providing reasoning.
// needs to be more holistic. needs to understand that to improve one's writing, you must focus on elevating their strengths and reducing their weaknesses. don't suggest an improvement that has no bearing on the student's existing work.
// perhaps being wrong isn't the worst thing, as it could train students to defend their essay. shouldn't be a feature though
const getFeedback = ({
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
}) => {
	let lastParagraphNumber = undefined as number | undefined
	let lastSentenceNumber = undefined as number | undefined

	const { messages, model, temperature, presencePenalty, frequencyPenalty } =
		{
			messages: [
				{
					role: "system" as "system" | "user" | "assistant",
					content:
						"You are an uncommonly creative tutor for high school students that works hard to guide students to think critically and communicate their ideas effectively.",
				},
				{
					role: "user" as "system" | "user" | "assistant",

					content: `The following is a prompt for an assignment in a high school course:
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
	.split("\n")
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
<course-name>${courseName}</course-name>

You will serve as a tutor for the high school student, providing them with thoughtful, engaging, and actionable feedback on their work, serving to guide the student to improve their ability to express their ideas effectively and to a deeper understanding of critical thinking. The process by which you will accomplish this will consist of four steps, and should look exactly as follows:

Synopsis
Construct a descriptive and comprehensive synopsis for the student's work to improve your understanding of it.

Commentary
Identify one area where the student demonstrates their strengths or unique character as a writer and the two areas where the student should most prioritize improving the communication of their ideas or their depth of thought. For each area of commentary, ask a question about your commentary in order to assess its accuracy and validity, and then provide extremely in-depth evidence and reasoning in order to clarify it accordingly. Unless absolutely necessary, do not suggest that the student increase the scope of their work, or that they alter their stylistic writing choices. Be detailed, thoughtful, and frequently reference the student's work.

Specific feedback
Provide four areas of feedback of varying lengths pertaining to individual segments of the student's work. Go into great depth in order to guide the student to improve both their work and their understanding of the subject matter. Additionally, to ensure that no part of the student's work is ignored, within each area of specific feedback, reference other similar parts of the student's work. Never rewrite the student's work for them; instead, cleverly ask them a question or make an insightful comment to lead them in the right direction. Each area of specific feedback should be in a numbered list and use the following format: \`Paragraph number: {paragraph number of the segment of the student's work pertaining to the feedback}
Sentence number: {sentence number of the segment of the student's work pertaining to the feedback, or -1 if the feedback applies to the paragraph as a whole}
Feedback: {the feedback to the student}\`

General feedback
Provide thoughtful, engaging, and actionable feedback on the student's work as a whole. Begin by acknowledging an interesting strength or unique characteristic of the student. In the next paragraph, go into great depth about the single biggest area for improvement in the student's work, while providing as many examples from the student's work as possible. Generalize upon the points you make to larger contexts in order to help the student understand the subject matter at a deeper level, even if it means going off on tangents. End on an appropriately positive, and perhaps creative, note.

Begin, and be interesting.`,
				},
			],
			model: "gpt-4" as const,
			temperature: 0,
			presencePenalty: 0.5, // setting this and the one below made a huge difference. my theory is that it decreases the model's bias to take on a similar writing style to that of the prompt, increasing its likelihood to follow the instructions and not just attempt to match them in style. consider tweaking these further
			frequencyPenalty: 0.35,
		}

	fetchOpenAIStream({
		messages,
		model,
		temperature,
		presencePenalty,
		frequencyPenalty,
		onContent: (content) => {
			const generalFeedbackHeaderIndex = content.search(
				/\nGeneral feedback:?\n.+/
			)

			if (generalFeedbackHeaderIndex !== -1) {
				onGeneralContent(
					content.slice(
						content.indexOf("\n", generalFeedbackHeaderIndex + 1) +
							1
					)
				)
			} else if (content.search(/\nSpecific feedback:?\n/) !== -1) {
				const lines = content.split("\n")

				const lastLine = lines.at(-1)
				const secondToLastLine = lines.at(-2)
				const thirdToLastLine = lines.at(-3)

				if (lastLine !== undefined) {
					if (
						lastLine.search(
							/^(\d+\.)?\s*Paragraph( number)?:? ?\d+:?$/
						) !== -1
					) {
						lastParagraphNumber = Number(
							lastLine.match(/\d+/g)?.at(-1)
						)
					} else if (
						lastLine.search(
							/^\s*Sentence( number)?:? ?-?\d+:?$/
						) !== -1
					) {
						lastSentenceNumber = Number(
							lastLine.match(/-?\d+/g)?.at(-1)
						)
					} else if (lastLine.search(/^\s*Feedback: .+/) !== -1) {
						if (
							lastParagraphNumber !== undefined &&
							lastSentenceNumber !== undefined
						) {
							onSpecificContent({
								content: lastLine.replace("Feedback: ", ""),
								paragraph: lastParagraphNumber,
								sentence: lastSentenceNumber,
							})
						} else {
							console.error(
								"This shouldn't happen, as lastParagraphNumber and lastSentenceNumber should be defined before feedback is streamed", // has happened before when there was "Sentence number:-1" or "2. Paragraph 3:"
								{ lastParagraphNumber, lastSentenceNumber }
							)
						}
					} else if (
						secondToLastLine?.includes("Feedback: ") &&
						lastParagraphNumber !== undefined &&
						lastSentenceNumber !== undefined
					) {
						onSpecificContent({
							content: secondToLastLine.replace("Feedback: ", ""),
							paragraph: lastParagraphNumber,
							sentence: lastSentenceNumber,
						})
					} else if (
						thirdToLastLine?.includes("Feedback: ") &&
						lastParagraphNumber !== undefined &&
						lastSentenceNumber !== undefined
					) {
						onSpecificContent({
							content: thirdToLastLine.replace("Feedback: ", ""),
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
					(line) => line.search(/^Specific feedback:?\s*$/) !== -1
				),
				generalFeedback: lines.findIndex(
					(line) => line.search(/^General feedback:?\s*$/) !== -1
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

export default getFeedback
