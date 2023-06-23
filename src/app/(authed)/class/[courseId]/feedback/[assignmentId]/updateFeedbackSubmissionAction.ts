"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Feedback from "~/data/Feedback"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const updateFeedbackSubmissionAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
		feedbackGivenAt: z.date(),
		submission: z.string(),
		submissionHTML: z.string(),
	})
)(
	async ({
		courseId,
		assignmentId,
		feedbackGivenAt,
		submission,
		submissionHTML,
	}) => {
		const { email } = await getAuthOrThrow({ cookies: cookies() })

		const role = await User({ email }).courseRole({ id: courseId })

		if (role === "none")
			throw new Error(
				"User must be in class to update submission on feedback"
			)

		await Feedback({
			courseId,
			assignmentId,
			userEmail: email,
			givenAt: feedbackGivenAt,
		}).update({
			submission,
			submissionHTML,
		})
	}
)

export default updateFeedbackSubmissionAction
