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
	onFinish,
	onRateLimit,
	onError,
}: OpenAIRequest & {
	onContent: (content: string) => void
	onFinish: (content: string) => void
	onRateLimit: () => void
	onError: (error: Error) => void
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
			}),
		),
		signal: abortController.signal,
	})
		.then(async (response) => {
			if (response.status === 429) return onRateLimit()

			if (response.body === null)
				throw new Error("The response body is empty.")

			const reader = response.body.getReader()

			let result = await reader.read()

			while (!result.done) {
				streamedContent += textDecoder.decode(result.value)

				onContent(streamedContent)

				if (abortController === null) {
					await reader.cancel()

					break
				}

				result = await reader.read()
			}

			onFinish(streamedContent)
		})
		.catch((error: Error) => {
			if (error.name === "AbortError") {
				onFinish(streamedContent)
			} else {
				onError(error)
			}
		})

	return {
		stop: () => {
			abortController?.abort()

			abortController = null
		},
	}
}
