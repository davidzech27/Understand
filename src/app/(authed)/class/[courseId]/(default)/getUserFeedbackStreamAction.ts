"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"

const getUserFeedbackStreamAction = zact(
	z.object({
		courseId: z.string(),
		limit: z.number(),
		cursor: z.number(),
	}),
)(async ({ courseId, limit, cursor }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	return await User({ email }).feedbackStream({ courseId, limit, cursor })
})

export default getUserFeedbackStreamAction
