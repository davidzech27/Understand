import { type OpenAIStreamRequest } from "./pages/api/openai";

export const summarizeInstructionsPrompt = ({
	text,
}: {
	text: string;
}): OpenAIStreamRequest => ({
	messages: [
		{
			role: "system",
			content:
				"You reply to instructions as clearly as possible, including no unnecessary information.",
		},
		{
			role: "user",
			content: `The following document was created by the teacher about an assignment that students are to complete. Based on this, write a detailed explanation of how the submitted assignment should look, ideally.

${text}`,
		},
	],
	model: "gpt-4",
	temperature: 0,
});

// try to add additional information like grade level and page count later

export const getFeedbackPrompt = ({
	instructions,
	assignment,
	studentName,
	courseName,
}: {
	instructions: string;
	assignment: string;
	studentName: string;
	courseName: string;
}): OpenAIStreamRequest => {
	return {
		messages: [
			{
				role: "system",
				content: "You are unusually engaging and insightful.",
			},
			{
				// If necessary include something like "However, analyses should not critique the student's unique style of writing unless absolutely necessary."
				role: "user",

				content: `You will be shown the prompt for an assignment and a student's progress on this assignment. Your role will be to provide thoughtful, engaging, and actionable feedback on the student's work, serving to guide them to reach their potential as a writer. The process by which you will accomplish this will consist of 2 steps:
1. Before providing the student with feedback, analyze the student's writing in order to identify areas where the student demonstrates their strengths or their character as a writer and areas where the student most needs to work on improving their writing. Your analysis must ultimately serve to improve the student's ability to communicate through writing and improve the depth of thought or critical thinking displayed. Additionally, it is absolutely imperative that before each individual area analyzed, you go into depth about the process by which you reached your analysis and your reasoning behind it. Ensure that analyses are detailed, thoughtful, and frequently reference the student's work.
2. Using this analysis, provide thoughtful engaging, and actionable feedback on the student's progress on the assignment so far. Your feedback should serve to guide the student in the right direction to improve both their work and their understanding of writing. Elaborate frequently and thoroughly so that the student can understand on a deeper level how and why to improve their writing. Additionally, acknowledge the student's demonstrated strengths and their character as a writer. Maintain the level of high level of nuance in your suggested revisions, ensuring that you understand the stylistic choices the student made and are careful not to suggest altering them. Ensuring that all advice is constructive in helping the student to reach their potential as a writer. Tailor the tone of the feedback to the level of sophistication of the student's writing. End on a positive note.

ASSIGNMENT PROMPT:
"""""
${instructions}
"""""

STUDENT'S PROGRESS:
"""""
${assignment}
"""""
EXTRA INFORMATION:
WORD COUNT: ${
					assignment
						.split(/\s/)
						.map((string) => string.trim())
						.filter((string) => string !== "").length
				}
STUDENT'S NAME: ${studentName}
YOUR NAME: Understand
COURSE NAME: ${courseName}
ANALYSIS FORMAT: FOCUSED PARAGRAPHS
FEEDBACK FORMAT: INFORMAL. DO NOT FORMAT LIKE A LETTER

Now, begin the begin the described 2 step process of analyzing the students work and then providing guidance based on this analysis in order to help them to become a more effective writer.`,
			},
		],
		model: "gpt-4",
		temperature: 0,
	};
};
