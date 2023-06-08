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
		submission: z.string(),
		rawResponse: z.string(),
		metadata: z.record(z.unknown()),
	})
)(async ({ courseId, assignmentId, submission, rawResponse, metadata }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	const givenAt = new Date()

	if (role === "none")
		return {
			givenAt,
		}

	await Feedback({
		courseId,
		assignmentId,
		userEmail: email,
		givenAt,
	}).create({
		submission,
		rawResponse,
		metadata,
	})

	return {
		givenAt,
	}
})

export default registerFeedbackAction
