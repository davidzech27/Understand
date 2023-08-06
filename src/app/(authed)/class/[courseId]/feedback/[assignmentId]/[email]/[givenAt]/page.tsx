import { notFound } from "next/navigation"

import User from "~/data/User"
import Assignment from "~/data/Assignment"
import { getAuthOrThrow } from "~/auth/jwt"
import { cookies } from "next/headers"
import Feedback from "~/data/Feedback"
import FeedbackComponent from "./Feedback"

export async function generateMetadata({
	params: { courseId, assignmentId, email },
}: {
	params: Params
}) {
	email = decodeURIComponent(email)

	const [user, assignment] = await Promise.all([
		User({ email }).get(),
		Assignment({ courseId, assignmentId }).get(),
	])

	return {
		title: `${user?.name}'s feedback on ${assignment?.title}`,
	}
}

export const runtime = "edge"

interface Params {
	courseId: string
	assignmentId: string
	email: string
	givenAt: string
}

export default async function FeedbackPage({
	params: { courseId, assignmentId, email, givenAt: givenAtString },
}: {
	params: Params
}) {
	email = decodeURIComponent(email)

	const givenAt = new Date(Number(givenAtString))

	const [feedback, assignment, role] = await Promise.all([
		Feedback({ courseId, assignmentId, userEmail: email, givenAt }).get(),

		Assignment({ courseId, assignmentId }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (feedback === undefined || assignment === undefined || role === "none")
		notFound()

	return <FeedbackComponent assignment={assignment} feedback={feedback} />
}
