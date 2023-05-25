import { env } from "~/env.mjs"

const getEmbedding = async (text: string) => {
	return (
		(await (
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
		).json()) as { data: [{ embedding: number[] }] }
	).data[0].embedding
}

export default getEmbedding
