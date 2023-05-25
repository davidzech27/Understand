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
	model: "gpt-4" | "gpt-3.5-turbo"
	temperature: number
	presencePenalty: number
	frequencyPenalty: number
	maxTokens?: number
}) => {
	return (
		(await (
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
		).json()) as { choices: [{ message: { content: string } }] }
	).choices[0].message.content
}

export default getCompletion
