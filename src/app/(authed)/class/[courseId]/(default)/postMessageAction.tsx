"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import User from "~/data/User"
import Message from "~/data/Message"
import { getAuthOrThrow } from "~/auth/jwt"

const postMessageAction = zact(
	z.object({
		courseId: z.string(),
		content: z.string(),
		limit: z.number(),
	})
)(async ({ courseId, content, limit }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	if (role !== "student")
		throw new Error(
			"Must be student of course to get message board messages"
		)

	const [similarMessages, { sentAt: postedSentAt }] = await Promise.all([
		Message({ courseId }).getSimilar({ content, limit }),
		Message({ courseId }).create({ fromEmail: email, content }),
	])

	return similarMessages.filter(
		({ from, sentAt }) =>
			from.email !== email || sentAt.valueOf() !== postedSentAt.valueOf()
	)
})

export default postMessageAction
