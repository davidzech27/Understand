"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Feedback, { feedbackInsightsSchema } from "~/data/Feedback"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const registerInsightsAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
		givenAt: z.date(),
		submissionHTML: z.string(),
		insights: feedbackInsightsSchema,
	})
)(async ({ courseId, assignmentId, givenAt, submissionHTML, insights }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	if (role !== "student")
		throw new Error("User must be student of course to register insights")

	await Feedback({
		courseId,
		assignmentId,
		userEmail: email,
		givenAt,
	}).update({
		submissionHTML,
		insights,
	})
})

export default registerInsightsAction
