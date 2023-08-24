import { z } from "zod"

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
			await fetch("/countTokens", {
				body: textEncoder.encode(JSON.stringify(arg)),
			})
		).json()
	)
}
