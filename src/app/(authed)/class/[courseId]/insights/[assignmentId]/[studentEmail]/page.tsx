import { notFound } from "next/navigation"

import User from "~/data/User"
import Assignment from "~/data/Assignment"
import Insight from "~/data/Insight"
import Insights from "./Insights"
import { getAuthOrThrow } from "~/auth/jwt"
import { cookies } from "next/headers"

export const generateMetadata = async ({
	params: { courseId, assignmentId, studentEmail },
}: {
	params: Params
}) => {
	studentEmail = decodeURIComponent(studentEmail)

	const [user, assignment] = await Promise.all([
		User({ email: studentEmail }).get(),
		Assignment({ courseId, assignmentId }).get(),
	])

	return {
		title: `${user?.name}'s work on ${assignment?.title}`,
	}
}

interface Params {
	courseId: string
	assignmentId: string
	studentEmail: string
}

const InsightsPage = async ({
	params: { courseId, assignmentId, studentEmail },
}: {
	params: Params
}) => {
	studentEmail = decodeURIComponent(studentEmail)

	const [insight, assignment, role] = await Promise.all([
		Insight({
			courseId,
			assignmentId,
			studentEmail,
		}).get(),
		Assignment({ courseId, assignmentId }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (insight === undefined || assignment === undefined || role !== "teacher")
		notFound()

	const { insights, submission } = insight

	return (
		<Insights
			assignment={assignment}
			insights={insights}
			submission={submission}
		/>
	)
}

export default InsightsPage
