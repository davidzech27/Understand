"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Course from "~/data/Course"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const getFeedbackStreamAction = zact(
	z.object({
		courseId: z.string(),
		limit: z.number(),
		cursor: z.number(),
	})
)(async ({ courseId, limit, cursor }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	if (role !== "teacher")
		throw new Error("Must be teacher of course to get feedback stream")

	return await Course({ id: courseId }).feedbackStream({ limit, cursor })
})

export default getFeedbackStreamAction
