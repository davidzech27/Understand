import { notFound } from "next/navigation"
import { getAuthOrThrow } from "~/auth/jwt"
import { cookies } from "next/headers"

import User from "~/data/User"
import Assignment from "~/data/Assignment"
import FeedbackInsights from "./FeedbackInsights"

export async function generateMetadata({
	params: { courseId, assignmentId, studentEmail },
}: {
	params: Params
}) {
	studentEmail = decodeURIComponent(studentEmail)

	const [user, assignment] = await Promise.all([
		User({ email: studentEmail }).get(),
		Assignment({ courseId, assignmentId }).get(),
	])

	return {
		title: `${user?.name}'s work on ${assignment?.title}`,
	}
}

export const runtime = "edge"

interface Params {
	courseId: string
	assignmentId: string
	studentEmail: string
}

export default async function InsightsPage({
	params: { courseId, assignmentId, studentEmail },
}: {
	params: Params
}) {
	studentEmail = decodeURIComponent(studentEmail)

	const [lastFeedbackInsights, assignment, role] = await Promise.all([
		User({ email: studentEmail }).lastFeedbackInsights({
			courseId,
			assignmentId,
		}),
		Assignment({ courseId, assignmentId }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (
		lastFeedbackInsights === undefined ||
		assignment === undefined ||
		role !== "teacher"
	)
		notFound()

	return (
		<FeedbackInsights
			assignment={assignment}
			submissionHTML={lastFeedbackInsights.submissionHTML}
			insights={lastFeedbackInsights.insights}
		/>
	)
}
