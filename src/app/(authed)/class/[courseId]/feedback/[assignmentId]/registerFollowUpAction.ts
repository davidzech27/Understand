"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Feedback from "~/data/Feedback"
import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"

const registerFollowUpAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
		feedbackGivenAt: z.date(),
		paragraphNumber: z.union([z.number(), z.undefined()]),
		sentenceNumber: z.union([z.number(), z.undefined()]),
		query: z.string(),
		rawResponse: z.string(),
		metadata: z.record(z.unknown()),
	})
)(
	async ({
		courseId,
		assignmentId,
		feedbackGivenAt,
		paragraphNumber,
		sentenceNumber,
		query,
		rawResponse,
		metadata,
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
			paragraphNumber,
			sentenceNumber,
			query,
			rawResponse,
			metadata,
		})
	}
)

export default registerFollowUpAction
