import { type NextRequest } from "next/server"
import { z } from "zod"

const requestSchema = z
	.object({
		message: z.object({
			data: z.string(),
		}),
	})
	.transform(({ message }) =>
		JSON.parse(Buffer.from(message.data, "base64").toString("utf8"))
	)

const dataSchema = z.object({})

const webhookHandler = async (request: NextRequest) => {
	const parsed = requestSchema.safeParse(await request.json())

	if (!parsed.success) return new Response(null, { status: 400 })

	const { data } = parsed

	console.log(JSON.stringify(data, null, 4))

	return new Response()
}

export default webhookHandler
