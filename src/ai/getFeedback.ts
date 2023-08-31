import splitSentences from "~/utils/splitSentences"
import fetchOpenAI from "./fetchOpenAI"

// need to make sure that reasoning doesn't provide limited view of student's work, otherwise will skew feedback

// old comments, may not be relevant anymore:
// specific feedback needs to ask a question or make an insightful comment to guide ${studentName} to a deeper understanding of the subject matter.
// it also needs to reference other parts of ${studentName}'s work so that no part of it is ignored
// general feedback isn't comprehensive enough
// sometimes doesn't see the big picture. big problem with GPTs in general
// should give student options for how to revise their work, and not prescribe its own. suggested solutions are too specific
// currently feedback is too certain of itself and not varied. not very interesting feedback and doesn't go beyond the absolute surface level when providing reasoning.
// needs to be more holistic. needs to understand that to improve one's writing, you must focus on elevating their strengths and reducing their weaknesses. don't suggest an improvement that has no bearing on ${studentName}'s existing work.
// perhaps being wrong isn't the worst thing, as it could train students to defend their essay. shouldn't be a feature though
export default async function getFeedback({
	assignmentTitle,
	assignmentInstructions,
	studentName,
	submissionText,
	onContent,
	onRateLimit,
	onFinish,
}: {
	assignmentTitle: string
	assignmentInstructions: string
	studentName: string
	submissionText: string
	onContent: ({
		content,
		paragraph,
		sentence,
	}: {
		content: string
		paragraph?: number
		sentence?: number
	}) => void
	onRateLimit: () => void
	onFinish: ({ rawResponse }: { rawResponse: string }) => void
}) {
	let lastParagraphNumber = -1
	let lastSentenceNumber = -1

	let lastFeedbackIndex = -1

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

					content: `A high school student named ${studentName} is working on an assignment titled "${assignmentTitle}". The following is information about the assignment and ${studentName}'s work on it:

Assignment prompt: """${assignmentInstructions}"""
${studentName}'s work: """${submissionText}"""
Word count: ${
						submissionText
							.split(/\s/)
							.filter((word) => word.trim() !== "").length
					}
${submissionText
	.split(/(\n|\t)/)
	.filter(
		(line) =>
			line.indexOf(".") !== -1 &&
			line.indexOf(".") !== line.lastIndexOf(".")
	)
	.map(
		(paragraph, paragraphIndex) =>
			`Paragraph ${paragraphIndex + 1} sentence count: ${
				splitSentences(paragraph).length
			}`
	)
	.join("\n")}

You'll serve as a tutor for ${studentName}, providing them with holistic and in-depth feedback on their work that serves to guide them to improve their ability to express their ideas effectively and to a deeper understanding of critical thinking. The process by which you will accomplish this will consist of four steps:

Synopsis
Construct a fine-grained summary of ${studentName}'s work and its stylistic choices.

Commentary
Identify one area where ${studentName} demonstrates their strengths or unique character as a writer and then the three areas where they could most improve their communication or depth of thought. For each commentary about a potential improvement, ask a question that ${studentName} would have, then respond to it with numerous direct references to their work.

Specific Feedback
Provide many areas of feedback pertaining to the segments of ${studentName}'s work that your commentary most applies to. In each area of feedback, frequently reference ${studentName}'s work and provide in-depth reasoning in order to best help them understand how to improve their work. Also frequently reference other similar paragraphs in ${studentName}'s work to ensure that every relevant paragraph is addressed. Do not prescribe any particular solution or idea to ${studentName}; instead, cleverly ask them a question or make an insightful comment to lead them in the right direction. Unless required by the assignment prompt, do not suggest that ${studentName} alter their stylistic writing choices or increase the scope of their work. Each area of specific feedback should use the following format:
Paragraph number: {paragraph number of the segment of ${studentName}'s work pertaining to the feedback}
Sentence number: {sentence number of the segment of ${studentName}'s work pertaining to the feedback, or -1 if the feedback applies to the entire paragraph}
Feedback: {the feedback to ${studentName}}

General Feedback
Conclude your feedback by making references to and extending upon the feedback you've provided. End on an appropriately positive, and perhaps creative, note.

Begin.`,
				},
			],
			model: "gpt-4-0613" as const,
			temperature: 0,
			presencePenalty: 0.0,
			frequencyPenalty: 0.25,
		}

	console.info(messages.map(({ content }) => content).join("\n\n\n\n"))

	const initialMessage = `Alright ${
		studentName.split(" ")[0]
	}, let's take a look at your work....`

	const initialMessageSplit = initialMessage.split(/(?=[\s,.])/)

	for (
		let initialMessagePartIndex = 0;
		initialMessagePartIndex < initialMessageSplit.length;
		initialMessagePartIndex++
	) {
		setTimeout(
			() =>
				onContent({
					content: initialMessageSplit
						.slice(0, initialMessagePartIndex + 1)
						.join(""),
					paragraph: undefined,
					sentence: undefined,
				}),
			initialMessagePartIndex * 100
		)
	}

	fetchOpenAI({
		messages,
		model,
		temperature,
		presencePenalty,
		frequencyPenalty,
		reason: "feedback",
		onContent: (content) => {
			const generalFeedbackHeaderIndex = content.search(
				/\n[*]*General Feedback:?[*]*\n+.+/
			)

			if (generalFeedbackHeaderIndex !== -1) {
				onContent({
					content: content.slice(
						content.indexOf("\n", generalFeedbackHeaderIndex + 1) +
							1
					),
					paragraph: undefined,
					sentence: undefined,
				})
			} else if (
				content.search(/\n[*]*Specific Feedback:?[*]*\n/) !== -1
			) {
				const feedbackItems = content.match(
					/(?<=\nFeedback[ ]*:[ ]*).+/g
				)

				const feedback = feedbackItems?.at(-1)

				const feedbackIndex = (feedbackItems?.length ?? 0) - 1

				if (feedback !== undefined) {
					if (feedbackIndex > lastFeedbackIndex) {
						lastFeedbackIndex = feedbackIndex

						lastParagraphNumber = Number(
							content
								.match(
									/(?<=\n(\d\.[ ]*)?[ ]*Paragraph( number)?[ ]*:?[ ]*)\d+/g
								)
								?.at(-1)
						)

						if (isNaN(lastParagraphNumber)) lastParagraphNumber = -1

						lastSentenceNumber = Number(
							content
								.match(
									/(?<=\n[ ]*Sentence( number)?[ ]*:?[ ]*)-?\d+/g
								)
								?.at(-1)
						)

						if (isNaN(lastSentenceNumber)) lastSentenceNumber = -1
					}

					if (lastParagraphNumber === -1) {
						console.error(
							"lastParagraphNumber should only be -1 if it is not found, which shouldn't happen",
							{ lastParagraphNumber, lastSentenceNumber }
						)
					} else {
						onContent({
							content: feedback,
							paragraph: lastParagraphNumber,
							sentence: lastSentenceNumber,
						})
					}
				}
			}
		},
		onRateLimit,
		onFinish: (content) => {
			console.log(content)

			onFinish({
				rawResponse: content,
			})
		},
	})
}
