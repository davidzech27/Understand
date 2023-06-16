import { env } from "~/env.mjs"

const getCompletion = async ({
	messages,
	model,
	temperature,
	presencePenalty,
	frequencyPenalty,
	maxTokens,
}: {
	messages: { role: "assistant" | "user" | "system"; content: string }[]
	model: "gpt-4-0613" | "gpt-3.5-turbo-0613" | "gpt-3.5-turbo-16k-0613"
	temperature: number
	presencePenalty: number
	frequencyPenalty: number
	maxTokens?: number
}) => {
	const response = (await (
		await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.OPENAI_SECRET_KEY}`,
			},
			body: JSON.stringify({
				messages,
				model,
				temperature,
				presence_penalty: presencePenalty,
				frequency_penalty: frequencyPenalty,
				max_tokens: maxTokens,
			}),
		})
	).json()) as
		| { choices: [{ message: { content: string } }] }
		| { error: { message: string } }

	if ("error" in response) {
		throw new Error(`OpenAI error: ${response.error.message}`)
	}

	return response.choices[0].message.content
}

export default getCompletion
