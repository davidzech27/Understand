import { type NextRequest } from "next/server"
import { z } from "zod"
import { OAuth2Client, type LoginTicket } from "google-auth-library"

import inngest from "~/background/inngest"

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

	const requestParsed = requestSchema.safeParse(json)

	if (!requestParsed.success)
		return new Response(
			`Incorrect request body format: ${JSON.stringify(json)}`,
			{ status: 400 }
		)

	const { data } = requestParsed

	const dataParsed = dataSchema.safeParse(data)

	if (!dataParsed.success)
		return new Response(`Incorrect data format: ${JSON.stringify(data)}`, {
			status: 400,
		})

	const idToken = request.headers.get("Authorization")?.split(" ")[1]

	if (idToken === undefined)
		return new Response("Missing ID token", { status: 401 })

	let ticket: LoginTicket

	try {
		ticket = await new OAuth2Client().verifyIdToken({
			idToken,
			audience:
				"https://understand.school/api/classroomPushNotificationWebhook",
		})
	} catch (_) {
		return new Response("Invalid ID token", { status: 401 })
	}

	const claim = ticket.getPayload()

	//! not entirely certain if this is enough security
	if (
		claim === undefined ||
		claim.email !== "461408025253-compute@developer.gserviceaccount.com" ||
		!claim.email_verified
	)
		return new Response("Invalid service account", { status: 403 })

	const event = dataParsed.data

	console.info("Event: ", event)

	if (event.collection === "courses.teachers")
		inngest.send("classroom/roster.updated", {
			data: {
				courseId: event.resourceId.courseId,
				email: event.resourceId.userId,
				role: "teacher",
			},
		})
	else if (event.collection === "courses.students")
		inngest.send("classroom/roster.updated", {
			data: {
				courseId: event.resourceId.courseId,
				email: event.resourceId.userId,
				role: "student",
			},
		})
	else if (event.collection === "courses.courseWork")
		inngest.send(
			event.eventType === "CREATED"
				? "classroom/assignment.created"
				: event.eventType === "MODIFIED"
				? "classroom/assignment.updated"
				: "classroom/assignment.deleted",
			{
				data: {
					courseId: event.resourceId.courseId,
					assignmentId: event.resourceId.id,
				},
			}
		)
	else if (event.collection === "courses.courseWork.studentSubmissions")
		inngest.send("classroom/studentSubmission.updated", {
			data: {
				courseId: event.resourceId.courseId,
				assignmentId: event.resourceId.courseWorkId,
				id: event.resourceId.id,
			},
		})

	return new Response()
}

export default webhookHandler
