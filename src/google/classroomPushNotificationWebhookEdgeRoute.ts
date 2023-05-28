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

const dataSchema = z.intersection(
	z.discriminatedUnion("collection", [
		z.object({
			collection: z.enum(["courses.teachers", "courses.students"]),
			resourceId: z.object({
				courseId: z.string(),
				userId: z.string(),
			}),
		}),
		z.object({
			collection: z.literal("courses.courseWork"),
			resourceId: z.object({
				courseId: z.string(),
				id: z.string(),
			}),
		}),
		z.object({
			collection: z.literal("courses.courseWork.studentSubmissions"),
			resourceId: z.object({
				courseId: z.string(),
				courseWorkId: z.string(),
				id: z.string(),
			}),
		}),
	]),
	z.object({
		registrationId: z.string(),
	})
)

const webhookHandler = async (request: NextRequest) => {
	const json = await request.json()

	console.info("JSON: ", json)

	const parsed = requestSchema.safeParse(json)

	if (!parsed.success) return new Response(null, { status: 400 })

	const { data } = parsed

	console.log(JSON.stringify(data, null, 4))

	return new Response()
}

export default webhookHandler
