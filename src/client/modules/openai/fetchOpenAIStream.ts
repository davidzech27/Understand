import { type OpenAIStreamRequest } from "~/server/modules/openai/edgeRoute";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const fetchOpenAIStream = async ({
	messages,
	model,
	temperature,
	onContent,
	onFinish,
}: OpenAIStreamRequest & {
	onContent: (content: string) => void;
	onFinish?: () => void;
}) => {
	const response = await fetch("/api/openai", {
		method: "POST",
		body: textEncoder.encode(
			JSON.stringify({
				messages,
				model,
				temperature,
			})
		),
	});

	if (response.body) {
		const reader = response.body.getReader();

		while (true) {
			const result = await reader.read();

			if (!result.done) {
				onContent(textDecoder.decode(result.value));
			} else {
				onFinish && onFinish();

				break;
			}
		}
	} else {
		console.error("This shouldn't happen");
	}
};

export default fetchOpenAIStream;
