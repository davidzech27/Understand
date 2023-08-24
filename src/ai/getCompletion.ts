import env from "env.mjs"
import tokenCost from "./tokenCost"

export default async function getCompletion({
	messages,
	model,
	temperature,
	presencePenalty,
	frequencyPenalty,
	maxTokens,
}: {
	messages: { role: "assistant" | "user" | "system"; content: string }[]
	model:
		| "gpt-4-0613"
		| "gpt-3.5-turbo-0613"
		| "gpt-3.5-turbo-16k-0613"
		| "gpt-3.5-turbo-0301"
	temperature: number
	presencePenalty: number
	frequencyPenalty: number
	maxTokens?: number
}) {
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
		| {
				choices: [{ message: { content: string } }]
				usage: { prompt_tokens: number; completion_tokens: number }
		  }
		| { error: { message: string } }

	if ("error" in response) {
		throw new Error(`OpenAI error: ${response.error.message}`)
	}

	return {
		completion: response.choices[0].message.content,
		cost:
			tokenCost.prompt[model] * response.usage.prompt_tokens +
			tokenCost.completion[model] * response.usage.completion_tokens,
	}
}
