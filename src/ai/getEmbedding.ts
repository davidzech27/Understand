import env from "env.mjs"
import tokenCost from "./tokenCost"

export default async function getEmbedding(text: string) {
	const response = (await (
		await fetch("https://api.openai.com/v1/embeddings", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.OPENAI_SECRET_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				input: text,
				model: "text-embedding-ada-002",
			}),
		})
	).json()) as {
		data: [{ embedding: number[] }]
		usage: {
			prompt_tokens: number
		}
	}

	return {
		embedding: response.data[0].embedding,
		cost:
			tokenCost.prompt["text-embedding-ada-002"] *
			response.usage.prompt_tokens,
	}
}
