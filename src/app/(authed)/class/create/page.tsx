import { cookies } from "next/headers"

import { getAuthOrThrow, setAuth } from "~/auth/jwt"
import CreateClassForm from "./CreateClassForm"
import GoogleAPI from "~/google/GoogleAPI"

//! export const runtime = "edge" add back when server components error is fixed

export const metadata = {
	title: "Create class",
}

const ClassCreatePage = async () => {
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
				"https://www.googleapis.com/auth/classroom.profile.photos"
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

	const coursesPromise = googleAPIPromise.then(
		async (googleAPI) =>
			googleAPI &&
			(await googleAPI.coursesTeaching())?.map((course) => ({
				...course,
				roster: googleAPI.courseRoster({ courseId: course.id }),
			}))
	)

	return (
		<CreateClassForm
			coursesPromise={coursesPromise}
			emailPromise={emailPromise}
		/>
	)
}

export default ClassCreatePage
