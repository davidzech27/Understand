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
			//! roster notifications currently not working. potentially because not testing on school account.
			resourceId: z.object({
				courseId: z.string(),
				userId: z.string(),
			}),
		}),
		z.object({
			collection: z.literal("courses.courseWork"),
			eventType: z.enum(["CREATED", "MODIFIED", "DELETED"]),
			resourceId: z.object({
				courseId: z.string(),
				id: z.string(),
			}),
		}),
		z.object({
			collection: z.literal("courses.courseWork.studentSubmissions"),
			eventType: z.literal("MODIFIED"),
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
	console.info("URL: ", request.nextUrl)
	console.info("Authorization: ", request.headers.get("Authorization"))

	const requestParsed = requestSchema.safeParse(json)

	if (!requestParsed.success) return new Response(null, { status: 400 })

	const { data } = requestParsed

	const dataParsed = dataSchema.safeParse(data)

	if (!dataParsed.success) return new Response(null, { status: 400 })

	const event = dataParsed.data

	console.log("Event: ", event)

	return new Response()
}

export default webhookHandler
