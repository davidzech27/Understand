"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const getStudentFeedbackStreamAction = zact(
	z.object({
		courseId: z.string(),
		limit: z.number(),
		cursor: z.number(),
	})
)(async ({ courseId, limit, cursor }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	if (role !== "teacher")
		throw new Error(
			"Must be teacher of course to get student feedback stream"
		)

	return await User({ email }).feedbackStream({ courseId, limit, cursor })
})

export default getStudentFeedbackStreamAction
