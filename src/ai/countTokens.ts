import { z } from "zod"

import env from "env.mjs"

const responseSchema = z.number()

const textEncoder = new TextEncoder()

export default async function countTokens(
	arg:
		| { text: string }
		| {
				messages: {
					role: "assistant" | "user" | "system"
					content: string
				}[]
		  }
) {
	return responseSchema.parse(
		await (
			await fetch(`${env.NEXT_PUBLIC_URL}/countTokens`, {
				body: textEncoder.encode(JSON.stringify(arg)),
			})
		).json()
	)
}
