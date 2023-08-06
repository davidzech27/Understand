"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import { getAuthOrThrow } from "~/auth/jwt"
import Feedback, { followUpSchema } from "~/data/Feedback"
import User from "~/data/User"

const registerFollowUpAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
		feedbackGivenAt: z.date(),
		paragraph: z.number().optional(),
		sentence: z.number().optional(),
		followUp: followUpSchema,
	})
)(
	async ({
		courseId,
		assignmentId,
		feedbackGivenAt,
		paragraph,
		sentence,
		followUp,
	}) => {
		const { email } = await getAuthOrThrow({ cookies: cookies() })

		const role = await User({ email }).courseRole({ id: courseId })

		if (role === "none")
			throw new Error(
				"User must be in class to register feedback follow-ups"
			)

		await Feedback({
			courseId,
			assignmentId,
			userEmail: email,
			givenAt: feedbackGivenAt,
		}).addFollowUp({
			paragraph: paragraph,
			sentence: sentence,
			followUp,
		})
	}
)

export default registerFollowUpAction
