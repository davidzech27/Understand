import fetchOpenAIStream from "../shared/fetchOpenAIStream";

const summarizeInstructions = ({
	instructions,
	onContent,
	onFinish,
}: {
	instructions: string;
	onContent: (content: string) => void;
	onFinish: () => void;
}) => {
	fetchOpenAIStream({
		messages: [
			{
				role: "system",
				content:
					"You reply to instructions as clearly as possible, including no unnecessary information.",
			},
			{
				role: "user",
				content: `The following document was created by the teacher about an assignment that students are to complete. Based on this, write a detailed explanation of how the submitted assignment should look, ideally.

${instructions}`,
			},
		],
		model: "gpt-4",
		temperature: 0,
		onContent,
		onFinish,
	});
};

export default summarizeInstructions;
