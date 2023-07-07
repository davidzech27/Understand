"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Feedback from "~/data/Feedback"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const registerFeedbackAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
		submissionHTML: z.string(),
		rawResponse: z.string(),
		metadata: z.record(z.unknown()),
	})
)(async ({ courseId, assignmentId, submissionHTML, rawResponse, metadata }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	const givenAt = new Date(Math.round(new Date().valueOf() / 1000) * 1000)

	if (role === "none")
		throw new Error("User must be in class to register feedback")

	await Feedback({
		courseId,
		assignmentId,
		userEmail: email,
		givenAt,
	}).create({
		submissionHTML,
		rawResponse,
		metadata,
	})

	return {
		givenAt,
	}
})

export default registerFeedbackAction
