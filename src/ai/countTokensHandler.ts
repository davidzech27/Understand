import { NextResponse } from "next/server"
import { z } from "zod"
import { encodingForModel } from "js-tiktoken"
import { withAxiom, type AxiomRequest } from "next-axiom"

const requestSchema = z.union([
	z.object({
		messages: z.array(
			z.object({
				role: z.enum(["assistant", "user", "system"]),
				content: z.string(),
			})
		),
	}),
	z.object({ text: z.string() }),
])

export default withAxiom(async function countTokensHandler(
	request: AxiomRequest
) {
	const requestParsed = requestSchema.safeParse(await request.json())

	if (!requestParsed.success) {
		return new Response("Bad Request", { status: 400 })
	}

	const { data } = requestParsed

	const text =
		"text" in data
			? data.text
			: data.messages
					.map(
						({ role, content }) => `<|im_start|>${role}
${content}
<|im_end|>`
					)
					.join("\n")
					.concat("\n<|im_start|>assistant")

	const encoding = encodingForModel("gpt-4-0613")

	const tokens = encoding.encode(text)

	return NextResponse.json(tokens.length)
})
