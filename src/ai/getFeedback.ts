import fetchOpenAIStream from "./fetchOpenAIStream"

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
		outline: string
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
						"You are uncommonly engaging and insightful. You're incredibly skilled at going into great depth and cover more than just surface level details. You always elaborate on your reasoning in interesting ways in order to help students understand at a deeper level how to improve their work. You enjoy reading the work of students with an interesting writing style. You have an interesting and unique tone.",
				},
				{
					role: "user" as "system" | "user" | "assistant",

					content: `You will be shown the prompt for an assignment and a high school student's progress on this assignment. Your role is to provide the student with thoughtful, engaging, and actionable feedback on their work, serving to guide the student to improve their ability to express their ideas effectively and to a deeper understanding of critical thinking. The process by which you will accomplish this will consist of four steps. First, you will provide an outline of the student's work with an assessment of each section embedded into it in order to ensure your understanding of the student's work. Second, you will provide commentary on the student's writing, serving as a basis for the feedback you provide the student to ensure that it is well thought-out. Third, you will provide the student with feedback pertaining to specific segments of their work. Fourth, you will provide the student with more general feedback on their work. This process should look exactly as follows:

Outline
Provide a sentence-by-sentence outline of the student's work, with your thoughts on each paragraph embedded into it, critically assessing its its quality of communication and critical thinking demonstrated. This is to ensure your understanding of the student's work and the accuracy of your commentary and feedback on it.

Commentary
Identify one area where the student demonstrates their strengths or unique character as a writer and two to three general areas where the student should prioritize improving their written communication or depth of thought. For each area of commentary, ask a question about your commentary in order to assess its accuracy and validity, and then provide extremely in-depth evidence and reasoning in order to clarify it accordingly, being incredibly careful not to suggest altering the student's stylistic writing choices or adding entirely new content unless absolutely necessary. Be detailed, thoughtful, and frequently reference the student's work.

Specific feedback
Provide feedback pertaining to specific segments of the student's work, serving to guide the student in the right direction to improve both their work and their understanding of the subject matter. There are three incredibly important things to keep in mind:
1. It is absolutely imperative that you maintain a high level of nuance in your feedback and that you understand the student's stylistic writing choices and are careful not to suggest altering them.
2. Never give any ideas or content away to students; you could instead cleverly ask them a question or make an insightful comment to lead them in the right direction.
3. Ensure that you frequently generalize upon the points you make to larger contexts in interesting ways in order to help students understand the subject matter at a deeper level.
Each area of feedback should be in a numbered list and use the following format: \`Paragraph number: \${paragraph number of the segment of the student's work pertaining to the feedback}
Sentence number: \${sentence number of the segment of the student's work pertaining to the feedback, or -1 if the feedback applies to the paragraph as a whole}
Feedback: \${the feedback to the student}\`

General feedback
Provide thoughtful, engaging, and actionable feedback on the student's work as a whole. Begin by acknowledging and going into depth about an interesting strength or unique characteristic of the student. Then, go into great depth about the single biggest area for improvement in the student's work. It is absolutely important that this is helpful for the student to gain a deeper understanding of the subject matter. Occasionally cover new information or go off on tangents. End on an appropriately positive, and perhaps creative, note.

ASSIGNMENT PROMPT:
"""""
${instructions}
"""""

STUDENT'S SUBMISSION:
"""""
${submission}
"""""
EXTRA INFORMATION:
WORD COUNT: ${
						submission
							.split(/\s/)
							.map((string) => string.trim())
							.filter((string) => string !== "").length
					}
STUDENT'S NAME: ${studentName}
YOUR NAME: Understand
COURSE NAME: ${courseName}

Now, begin the described four-step process.`,
				},
			],
			model: "gpt-4" as const,
			temperature: 0,
			presencePenalty: 0.35, // setting this and the one below made a huge difference. my theory is that it decreases the model's bias to take on a similar writing style to that of the prompt, increasing its likelihood to follow the instructions and not just attempt to match them in style. consider tweaking these further
			frequencyPenalty: 0.5,
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
				outline: lines
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

// good response example

// Outline
// 1. Introduction: Diction, imagery, and details create an unsettling and somber tone in the scene where the monster is brought to life in Frankenstein.
// 2. Diction: The use of words like "agony" and "dismally" contribute to the unsettling and somber tone.
// 3. Imagery: Descriptions of the monster's appearance, such as "straight black lips" and "shrivelled complexion," evoke feelings of disgust and repulsion.
// 4. Details: The visibility of the monster's insides and the contrast between its luxurious features and watery eyes emphasize its unnatural existence.
// 5. Conclusion: Through diction, imagery, and detail, Shelley shapes the tone of the monster's creation scene to convey Victor's fault in creating such an unnatural creature.

// Commentary
// Strength: The student effectively analyzes how diction, imagery, and details contribute to the unsettling and somber tone in Frankenstein's creation scene.
// Question: Does the student provide sufficient evidence from the text to support their analysis?
// Answer: Yes, they provide multiple examples from the text for each element (diction, imagery, details) that demonstrate how these elements contribute to the tone.

// Area for improvement 1: The essay could benefit from a clearer connection between specific textual elements and their impact on readers' emotions or perceptions.
// Question: Does the student explain why certain words or descriptions evoke specific emotions or reactions from readers?
// Answer: Not consistently; while some explanations are provided (e.g., "agony" being alarming), others could be further elaborated upon.

// Area for improvement 2: The essay could delve deeper into how this passage's tone relates to broader themes or messages within Frankenstein as a whole.
// Question: Does the student discuss how this passage's tone contributes to larger ideas within the novel?
// Answer: Only briefly; they mention that it shows Victor should have known better than to create the monster, but this could be expanded upon.

// Specific feedback
// 1. Paragraph number: 2
// Sentence number: 3
// Feedback: Consider explaining why the word "agony" specifically evokes a sense of alarm in readers. For example, you might discuss how it suggests an extreme level of emotional pain that is difficult to endure.

// 2. Paragraph number: 3
// Sentence number: 4
// Feedback: To strengthen your analysis of the imagery in this passage, you could explore why the description of the monster's "shrivelled complexion" is particularly unsettling or repulsive to readers. What associations might they have with such a description?

// 3. Paragraph number: 4
// Sentence number: -1
// Feedback: In this paragraph, consider discussing how these details about the monster's appearance not only emphasize its unnatural existence but also contribute to broader themes within Frankenstein, such as the dangers of playing God or the consequences of pursuing knowledge without considering potential outcomes.

// General feedback
// David, you demonstrate a strong ability to analyze how diction, imagery, and details contribute to the unsettling and somber tone in this passage from Frankenstein. Your essay is well-organized and provides clear examples from the text to support your points.

// To further enhance your analysis, consider delving deeper into why specific words or descriptions evoke particular emotions or reactions from readers. This will help you more effectively demonstrate how these elements shape the tone of the passage.

// Additionally, try connecting this passage's tone to larger themes or messages within Frankenstein as a whole. By doing so, you can show how Shelley's use of tone in this scene contributes to her overall exploration of important ideas throughout the novel.

// Keep up the good work! Your thoughtful analysis and attention to detail make for an engaging and insightful essay.

// less good response example

// Outline
// 1. Introduction: Diction, imagery, and details create an unsettling and somber tone in the passage from Frankenstein.
// 2. Diction: The use of words like "agony" and "dismally" contribute to the unsettling and somber tone.
// 3. Imagery: Descriptions of the monster's appearance, such as "straight black lips" and "shrivelled complexion," evoke feelings of disgust and repulsion.
// 4. Details: The visibility of the monster's insides and the contrast between his luxurious features and watery eyes emphasize the unnaturalness of his creation.
// 5. Conclusion: Through diction, imagery, and detail, Shelley establishes a tone that conveys Victor's fault in creating an unnatural creature.

// Commentary
// Strength: The student effectively analyzes how diction, imagery, and details contribute to the unsettling and somber tone in the passage from Frankenstein.
// Question: Does the student provide sufficient evidence to support their analysis?
// Answer: Yes, they provide specific examples from the text for each element (diction, imagery, details) that demonstrate how these elements contribute to the overall tone.

// Area for improvement 1: The student could further explore how these elements relate to larger themes or motifs within the novel.
// Question: How can this be achieved without adding entirely new content?
// Answer: By connecting their analysis to broader ideas within Frankenstein, such as Victor's hubris or humanity's fear of the unknown.

// Area for improvement 2: The essay could benefit from a more engaging introduction and conclusion.
// Question: How can this be achieved without altering the student's stylistic writing choices?
// Answer: By incorporating a more thought-provoking hook in the introduction and ending on a note that encourages further reflection on the significance of tone in literature.

// Specific feedback
// 1. Paragraph number: 1
// Sentence number: -1
// Feedback: Consider starting your introduction with a more engaging hook that captures the reader's attention and sets the stage for your analysis.

// 2. Paragraph number: 2
// Sentence number: -1
// Feedback: To strengthen your analysis, try connecting the unsettling and somber tone created by diction to larger themes or motifs within Frankenstein, such as Victor's hubris or humanity's fear of the unknown.

// 3. Paragraph number: 5
// Sentence number: -1
// Feedback: In your conclusion, consider ending on a note that encourages further reflection on the significance of tone in literature and how it can shape a reader's experience.

// General feedback
// David, you have done an excellent job analyzing how diction, imagery, and details contribute to the unsettling and somber tone in the passage from Frankenstein. Your ability to provide specific examples from the text demonstrates a strong understanding of these literary elements. To further enhance your essay, consider connecting your analysis to broader themes or motifs within the novel and incorporating more engaging hooks in your introduction and conclusion. By doing so, you will not only deepen your understanding of Frankenstein but also encourage readers to reflect on the significance of tone in literature. Keep up the great work!
