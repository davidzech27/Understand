import { NextRequest } from "next/server"
import { z } from "zod"
import { OpenAIStream, StreamingTextResponse } from "ai"

import env from "env.mjs"
import { getAuth } from "~/auth/jwt"
import countTokens, { initializeWASM } from "./countTokens"
import tokenCost from "./tokenCost"
import User from "~/data/User"

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
	reason: z.enum(["feedback", "followUp", "insights", "chat"]),
})

export type OpenAIRequest = z.infer<typeof requestSchema>

export default async function openaiHandler(request: NextRequest) {
	await initializeWASM()

	const auth = await getAuth({ cookies: request.cookies })

	if (auth === undefined)
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
		reason,
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

	const promptTokens = countTokens({ messages })

	let completionTokens = 0

	const openaiStream = OpenAIStream(openaiResponse, {
		onToken: () => {
			completionTokens++
		},
		onFinal: async () => {
			await User({ email: auth.email }).increaseCost({
				[reason]:
					tokenCost.prompt[model] * promptTokens +
					tokenCost.completion[model] * completionTokens,
			})
		},
	})

	return new StreamingTextResponse(openaiStream)
}
