import { NextRequest } from "next/server"
import { z } from "zod"
import env from "env.mjs"
import { getAuth } from "~/auth/jwt"

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const requestSchema = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(["assistant", "user", "system"]),
				content: z.string(),
				name: z.string().optional(),
			})
		)
		.min(1),
	model: z.enum([
		"gpt-4-0613",
		"gpt-3.5-turbo-0613",
		"gpt-3.5-turbo-16k-0613",
	]),
	temperature: z.number().min(0).max(2),
	presencePenalty: z.number().min(-2).max(2),
	frequencyPenalty: z.number().min(-2).max(2),
	maxTokens: z.number().optional(),
})

export type OpenAIRequest = z.infer<typeof requestSchema>

export default async function openaiHandler(request: NextRequest) {
	if ((await getAuth({ cookies: request.cookies })) === undefined)
		return new Response("Invalid authorization", { status: 401 })

	const requestParsed = requestSchema.safeParse(await request.json())

	if (!requestParsed.success) {
		return new Response("Bad Request", { status: 400 })
	}

	const {
		messages,
		model,
		temperature,
		presencePenalty,
		frequencyPenalty,
		maxTokens,
	} = requestParsed.data

	const openaiResponse = await fetch(
		"https://api.openai.com/v1/chat/completions",
		{
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
				stream: true,
			}),
		}
	)

	return new Response(
		new ReadableStream({
			start: async (controller) => {
				if (openaiResponse.body) {
					const reader = openaiResponse.body.getReader()

					let previousIncompleteChunk: Uint8Array | undefined =
						undefined

					let result = await reader.read()

					while (!result.done) {
						let chunk = result.value

						if (previousIncompleteChunk !== undefined) {
							const newChunk = new Uint8Array(
								previousIncompleteChunk.length + chunk.length
							)

							newChunk.set(previousIncompleteChunk)

							newChunk.set(chunk, previousIncompleteChunk.length)

							chunk = newChunk

							previousIncompleteChunk = undefined
						}

						const parts = textDecoder
							.decode(chunk)
							.split("\n")
							.filter((line) => line !== "")
							.map((line) => line.replace(/^data: /, ""))

						for (const part of parts) {
							if (part !== "[DONE]") {
								try {
									const partParsed = JSON.parse(part) as {
										choices?: {
											delta?: { content?: unknown }
										}[]
									}

									if (
										typeof partParsed.choices?.[0]?.delta
											?.content !== "string"
									)
										continue

									const contentDelta =
										partParsed.choices[0].delta.content

									controller.enqueue(
										textEncoder.encode(contentDelta)
									)
								} catch (error) {
									previousIncompleteChunk = chunk
								}
							} else {
								controller.close()

								return
							}
						}

						result = await reader.read()
					}
				} else {
					console.error("OpenAI response should have body")
				}
			},
		}),
		{
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		}
	)
}
