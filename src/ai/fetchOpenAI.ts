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
	reason,
	onContent,
	onRateLimit,
	onFinish,
}: OpenAIRequest & {
	onContent: (content: string) => void
	onRateLimit: () => void
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
				reason,
			})
		),
	})

	if (response.status === 429) return onRateLimit()

	if (response.body) {
		const reader = response.body.getReader()

		let streamedContent = ""

		let result = await reader.read()

		while (!result.done) {
			streamedContent += textDecoder.decode(result.value)

			onContent(streamedContent)

			result = await reader.read()
		}

		onFinish && onFinish(streamedContent)
	} else {
		console.error("This shouldn't happen")
	}
}
