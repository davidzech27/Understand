import { type OpenAIRequest } from "./openAIHandler"

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export default async function fetchOpenAI({
	messages,
	model,
	temperature,
	presencePenalty,
	frequencyPenalty,
	maxTokens,
	onContent,
	onFinish,
}: OpenAIRequest & {
	onContent: (content: string) => void
	onFinish: (content: string) => void
}) {
	const response = await fetch("/api/openai", {
		method: "POST",
		body: textEncoder.encode(
			JSON.stringify({
				messages,
				model,
				temperature,
				presencePenalty,
				frequencyPenalty,
				maxTokens,
			})
		),
	})

	if (response.body) {
		const reader = response.body.getReader()

		let streamedContent = ""

		while (true) {
			const result = await reader.read()

			if (!result.done) {
				streamedContent += textDecoder.decode(result.value)

				onContent(streamedContent)
			} else {
				onFinish && onFinish(streamedContent)

				break
			}
		}
	} else {
		console.error("This shouldn't happen")
	}
}
