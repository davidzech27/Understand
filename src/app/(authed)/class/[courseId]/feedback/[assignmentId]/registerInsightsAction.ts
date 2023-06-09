"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Insight, { insightsSchema } from "~/data/Insight"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const registerInsightsAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
		submission: z.string(),
		insights: insightsSchema,
	})
)(async ({ courseId, assignmentId, submission, insights }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	if (role !== "student") return

	await Insight({ courseId, assignmentId, studentEmail: email }).upsert({
		submission,
		insights,
	})
})

export default registerInsightsAction
