import { NextRequest } from "next/server"
import { z } from "zod"
import { env } from "~/env.mjs"
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
	model: z.enum(["gpt-4", "gpt-3.5-turbo"]),
	temperature: z.number().min(0).max(2),
	presencePenalty: z.number().min(-2).max(2),
	frequencyPenalty: z.number().min(-2).max(2),
})

export type OpenAIStreamRequest = z.infer<typeof requestSchema>

const openaiHandler = async (request: NextRequest) => {
	if ((await getAuth({ cookies: request.cookies })) === undefined)
		return new Response("Invalid authorization", { status: 401 })

	const requestParsed = requestSchema.safeParse(await request.json())

	if (!requestParsed.success) {
		return new Response("Bad Request", { status: 400 })
	}

	const { messages, model, temperature, presencePenalty, frequencyPenalty } =
		requestParsed.data

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

					while (true) {
						const result = await reader.read()

						if (!result.done) {
							let chunk = result.value

							if (previousIncompleteChunk !== undefined) {
								const newChunk = new Uint8Array(
									previousIncompleteChunk.length +
										chunk.length
								)

								newChunk.set(previousIncompleteChunk)

								newChunk.set(
									chunk,
									previousIncompleteChunk.length
								)

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
										const partParsed = JSON.parse(
											part
										) as any

										if (
											typeof partParsed.choices[0].delta
												.content !== "string"
										)
											continue

										const contentDelta = partParsed
											.choices[0].delta.content as string

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
						} else {
							console.error(
								"This also shouldn't happen, because controller should be close()ed before getting to end of stream. Result: " +
									JSON.stringify(result, null, 4)
							)
						}
					}
				} else {
					console.error("This shouldn't happen")
				}
			},
		}),
		{
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		}
	)
}

export default openaiHandler
