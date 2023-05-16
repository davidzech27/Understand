import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Assignment from "~/data/Assignment"
import User from "~/data/User"
import Course from "~/data/Course"
import Feedback from "./Feedback"

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
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
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
		course === undefined
	)
		notFound()

	// overflow-y-scroll -mr-2

	return (
		<Feedback
			assignment={assignment}
			profileName={profile.name}
			courseName={course.name}
		/>
	)
}

export default FeedbackPage
