import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import CreateClassForm from "./CreateClassForm"
import GoogleAPI from "~/google/GoogleAPI"
import User from "~/data/User"

export const runtime = "edge"

export const metadata = {
	title: "Create class",
}

export default function ClassCreatePage() {
	const authPromise = getAuthOrThrow({ cookies: cookies() })

	const googleAPIPromise = authPromise.then(
		({ googleRefreshToken, googleScopes }) =>
			!googleScopes.includes(
				"https://www.googleapis.com/auth/classroom.courses.readonly"
			) ||
			!googleScopes.includes(
				"https://www.googleapis.com/auth/classroom.rosters.readonly"
			) ||
			!googleScopes.includes(
				"https://www.googleapis.com/auth/classroom.profile.emails"
			) ||
			!googleScopes.includes(
				"https://www.googleapis.com/auth/classroom.student-submissions.students.readonly"
			) ||
			!googleScopes.includes(
				"https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly"
			) ||
			!googleScopes.includes(
				"https://www.googleapis.com/auth/drive.readonly"
			)
				? undefined
				: GoogleAPI({
						refreshToken: googleRefreshToken,
				  })
	)

	const emailPromise = authPromise.then(({ email }) => email)

	const userPromise = emailPromise.then((email) =>
		User({ email })
			.get()
			.then((user) => user ?? notFound())
	)

	const coursesPromise = googleAPIPromise.then(
		(googleAPI) =>
			googleAPI &&
			userPromise.then(async ({ superuser }) =>
				(superuser
					? (
							await Promise.all([
								googleAPI.coursesTeaching({
									includeArchived: true,
								}),
								googleAPI.coursesEnrolled({
									includeArchived: true,
								}),
							])
					  ).flat()
					: await googleAPI.coursesTeaching()
				)?.map((course) => ({
					...course,
					roster: googleAPI.courseRoster({ courseId: course.id }),
				}))
			)
	)

	return (
		<CreateClassForm
			coursesPromise={coursesPromise}
			userPromise={userPromise}
		/>
	)
}
