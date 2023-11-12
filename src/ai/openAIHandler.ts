import { cookies } from "next/headers"
import { z } from "zod"
import { OpenAIStream, StreamingTextResponse } from "ai"

import env from "~/env.mjs"
import { getAuth } from "~/auth/jwt"
import countTokens from "./countTokens"
import tokenCost from "./tokenCost"
import User from "~/data/User"

const requestSchema = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(["assistant", "user", "system"]),
				content: z.string(),
				name: z.string().optional(),
			}),
		)
		.min(1),
	model: z.enum(["gpt-4", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]),
	temperature: z.number().min(0).max(2),
	presencePenalty: z.number().min(-2).max(2),
	frequencyPenalty: z.number().min(-2).max(2),
	maxTokens: z.number().optional(),
	reason: z.enum(["feedback", "followUp", "insights", "chat"]),
})

export type OpenAIRequest = z.infer<typeof requestSchema>

export default (async function openaiHandler(request: Request) {
	if (!("cookies" in request)) return

	const auth = await getAuth({ cookies: cookies() })

	if (auth === undefined)
		return new Response("Invalid authorization", { status: 401 })

	const requestParsed = requestSchema.safeParse(await request.json())

	if (!requestParsed.success)
		return new Response("Bad Request", { status: 400 })

	const {
		messages,
		model,
		temperature,
		presencePenalty,
		frequencyPenalty,
		maxTokens,
		reason,
	} = requestParsed.data

	// since no await, may allow users to go over limit if requests are in close proximity. change if users not associated with an onboarded school can send requests
	const unregisterCompletionStreamPromise = User({
		email: auth.email,
	}).registerCompletionStream()

	try {
		const overRateLimit = await User({ email: auth.email }).overRateLimit({
			school: auth.school,
		})

		if (overRateLimit) {
			await (
				await unregisterCompletionStreamPromise
			)()

			return new Response("Rate limit exceeded", { status: 429 })
		}

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
					presencePenalty,
					frequencyPenalty,
					maxTokens: maxTokens,
					stream: true,
				}),
			},
		)

		const promptTokensPromise = countTokens({ messages })

		let completion = ""
		let completionTokens = 0

		const openaiStream = OpenAIStream(openaiResponse, {
			onToken: (token) => {
				completion += token
				completionTokens++
			},
			onFinal: async () => {
				const promptTokens = await promptTokensPromise

				console.info("User OpenAI request", {
					email: auth.email,
					reason,
					messages: messages
						.map(({ content }) => content)
						.concat(completion),
					cost:
						tokenCost.prompt[model] * promptTokens +
						tokenCost.completion[model] * completionTokens,
				})

				await Promise.all([
					(await unregisterCompletionStreamPromise)(),
					User({ email: auth.email }).increaseCost({
						[reason]:
							tokenCost.prompt[model] * promptTokens +
							tokenCost.completion[model] * completionTokens,
					}),
				])
			},
		})

		return new StreamingTextResponse(openaiStream)
	} catch (error) {
		console.error("User OpenAI request error", {
			email: auth.email,
			reason,
			error,
		})

		await (
			await unregisterCompletionStreamPromise
		)()
	}
})
