import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { get_encoding } from "tiktoken"

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

export default async function countTokensHandler(request: NextRequest) {
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

	const encoding = get_encoding("cl100k_base")

	const tokens = encoding.encode(text)

	encoding.free()

	return NextResponse.json(tokens.length)
}
