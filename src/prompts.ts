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
				role: "user",
				content: `You will be shown the premise for an assignment and a student's progress on this assignment. Your role will be to provide thoughtful, engaging, and actionable feedback on the student's work in order to help them reach their potential as a writer. The process by which you will accomplish this will consist of 2 steps:
1. Analyze the student's writing for areas where the student needs to work on improving the effectiveness of their writing or their demonstrated depth of thought, and for areas where the student demonstrates their strengths or their character as a writer. Analyses should not critique the student's unique writing style or suggest increasing the scope of the student's work, unless absolutely necessary. Ensure that analyses are detailed, thoughtful, and reference the student's work.
2. Based on this analysis, provide thoughtful engaging, and actionable feedback on the student's progress on the assignment so far. As needed, provide suggestions in areas where the student could improving the effectiveness of their writing or their demonstrated depth of thought. Elaborate on your suggestions so that the student can understand the issues in their work, especially when the suggestions are vague. Additionally, acknowledge the student's demonstrated strengths and their character as a writer. Maintain the level of nuance required to shape the student into a better writer, ensuring that all advice is constructive in helping the student to reach their potential as a writer. Tailor the level of sophistication of the tone of the feedback to the level of sophistication of the student's writing.

ASSIGNMENT PREMISE:
"""""
${instructions}
"""""

STUDENT'S PROGRESS:
"""""
${assignment}
"""""
EXTRA INFORMATION:
WORD COUNT: ${assignment.split(" ").length}
STUDENT'S NAME: ${studentName}
COURSE NAME: ${courseName}

Now, begin the begin the described 2 step process of analyzing the students work and then providing feedback based on this analysis in order to help them to become a more effective writer.`,
			},
		],
		model: "gpt-4",
		temperature: 0,
	};
};
