import { type OpenAIStreamRequest } from "~/server/modules/openai/edgeRoute";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const fetchOpenAIStream = async ({
	messages,
	model,
	temperature,
	presencePenalty,
	frequencyPenalty,
	onContent,
	onFinish,
}: OpenAIStreamRequest & {
	onContent: (content: string) => void;
	onFinish: (content: string) => void;
}) => {
	const response = await fetch("/api/openai", {
		method: "POST",
		body: textEncoder.encode(
			JSON.stringify({
				messages,
				model,
				temperature,
				presencePenalty,
				frequencyPenalty,
			})
		),
	});

	if (response.body) {
		const reader = response.body.getReader();

		let streamedContent = "";

		while (true) {
			const result = await reader.read();

			if (!result.done) {
				streamedContent += textDecoder.decode(result.value);

				onContent(streamedContent);
			} else {
				onFinish && onFinish(streamedContent);

				break;
			}
		}
	} else {
		console.error("This shouldn't happen");
	}
};

export default fetchOpenAIStream;
