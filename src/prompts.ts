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
