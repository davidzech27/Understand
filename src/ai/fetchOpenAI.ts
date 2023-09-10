import { type OpenAIRequest } from "./openAIHandler"

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export default function fetchOpenAI({
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
	let abortController: AbortController | null = new AbortController()

	let streamedContent = ""

	fetch("/api/openai", {
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
		signal: abortController.signal,
	})
		.then(async (response) => {
			if (response.status === 429) return onRateLimit()

			if (response.body) {
				const reader = response.body.getReader()

				let result = await reader.read()

				while (!result.done) {
					streamedContent += textDecoder.decode(result.value)

					onContent(streamedContent)

					if (abortController === null) {
						reader.cancel()

						break
					}

					result = await reader.read()
				}

				onFinish && onFinish(streamedContent)
			} else {
				console.error("This shouldn't happen")
			}
		})
		.catch((error: Error) => {
			if (error.name === "AbortError") {
				onFinish && onFinish(streamedContent)
			} else {
				console.error(error.name)
			}
		})

	return {
		stop: () => {
			abortController?.abort()

			abortController = null
		},
	}
}
