"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Feedback from "~/data/Feedback"
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

	const givenAt = new Date()

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
