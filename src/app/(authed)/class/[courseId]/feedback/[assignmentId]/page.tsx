import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Assignment from "~/data/Assignment"
import User from "~/data/User"
import Course from "~/data/Course"
import Feedback from "./Feedback"
import GoogleAPI from "~/google/GoogleAPI"

export const generateMetadata = async ({
	params: { courseId, assignmentId },
}: {
	params: Params
}) => {
	const assignment = await Assignment({ courseId, assignmentId }).get()

	return {
		title: `Feedback on ${assignment?.title}`,
	}
}

interface Params {
	courseId: string
	assignmentId: string
}

const FeedbackPage = async ({
	params: { courseId, assignmentId },
}: {
	params: Params
}) => {
	const [[role, profile], assignment, course] = await Promise.all([
		getAuthOrThrow({ cookies: cookies() }).then(
			({
				email,
				googleAccessToken,
				googleRefreshToken,
				googleRefreshTokenExpiresMillis,
			}) =>
				Promise.all([
					User({ email }).courseRole({ id: courseId }),
					User({ email }).get(),
				])
		),
		Assignment({ courseId, assignmentId }).get(),
		Course({ id: courseId }).get(),
	])

	if (
		role === "none" ||
		profile === undefined ||
		assignment === undefined ||
		course === undefined ||
		assignment.instructions === undefined
	)
		notFound()

	return (
		<Feedback
			assignment={{
				...assignment,
				instructions: assignment.instructions,
			}}
			profileName={profile.name}
			courseName={course.name}
		/>
	)
}

export default FeedbackPage
