import { notFound } from "next/navigation"

import User from "~/data/User"
import Assignment from "~/data/Assignment"
import Insights from "./Insights"
import { getAuthOrThrow } from "~/auth/jwt"
import { cookies } from "next/headers"

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

	const [insights, submissionHTML, assignment, role] = await Promise.all([
		User({ email: studentEmail }).lastFeedbackInsights({
			courseId,
			assignmentId,
		}),
		User({ email: studentEmail }).lastSubmissionHTML({
			courseId,
			assignmentId,
		}),
		Assignment({ courseId, assignmentId }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (
		insights === undefined ||
		submissionHTML === undefined ||
		assignment === undefined ||
		role !== "teacher"
	)
		notFound()

	return (
		<Insights
			assignment={assignment}
			insights={insights}
			submission={submissionHTML}
		/>
	)
}
