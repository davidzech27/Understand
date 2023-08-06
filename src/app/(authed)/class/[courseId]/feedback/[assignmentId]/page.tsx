import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Assignment from "~/data/Assignment"
import User from "~/data/User"
import Course from "~/data/Course"
import Feedback from "./Feedback"
import GoogleAPI from "~/google/GoogleAPI"

export async function generateMetadata({
	params: { courseId, assignmentId },
}: {
	params: Params
}) {
	const assignment = await Assignment({ courseId, assignmentId }).get()

	return {
		title: `Feedback on ${assignment?.title}`,
	}
}

export const runtime = "edge"

interface Params {
	courseId: string
	assignmentId: string
}

export default async function FeedbackPage({
	params: { courseId, assignmentId },
}: {
	params: Params
}) {
	const [
		[role, profile, linkedSubmissions, feedbackHistory],
		assignment,
		course,
	] = await Promise.all([
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			Promise.all([
				User({ email }).courseRole({
					id: courseId,
				}),
				User({ email }).get(),
				Course({
					id: courseId,
				})
					.syncedRefreshToken()
					.then(async (refreshToken) => {
						if (refreshToken === undefined) return []

						const googleAPI = await GoogleAPI({
							refreshToken,
						})

						return (
							await googleAPI.studentSubmissions({
								courseId,
								assignmentId,
								email,
							})
						)
							.map((submission) =>
								submission.type === "driveFile"
									? submission.driveFile
									: undefined
							)
							.filter(Boolean)
							.map((submission) => ({
								...submission,
								htmlPromise: googleAPI.driveFileHTML({
									id: submission.id,
								}),
							}))
					}),
				User({ email }).feedbackHistory({ courseId, assignmentId }),
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
			feedbackHistory={feedbackHistory}
			email={profile.email}
			profileName={profile.name}
			courseName={course.name}
			role={role}
			linkedSubmissions={linkedSubmissions}
		/>
	)
}
