import { cookies } from "next/headers"

import { getAuthOrThrow, setAuth } from "~/auth/jwt"
import CreateClassForm from "./CreateClassForm"
import GoogleAPI from "~/google/GoogleAPI"

//! export const runtime = "edge" add back when server components error is fixed

export const metadata = {
	title: "Create class",
}

const ClassCreatePage = async () => {
	const googleAPIPromise = getAuthOrThrow({ cookies: cookies() }).then(
		({
			googleAccessToken,
			googleRefreshToken,
			googleRefreshTokenExpiresMillis,
			googleScopes,
		}) =>
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
			) ||
			!googleScopes.includes(
				"https://www.googleapis.com/auth/classroom.push-notifications"
			)
				? undefined
				: GoogleAPI({
						accessToken: googleAccessToken,
						refreshToken: googleRefreshToken,
						expiresMillis: googleRefreshTokenExpiresMillis,
						onRefreshAccessToken: ({
							accessToken,
							expiresMillis,
						}) => {}, //!
				  })
	)

	const coursesPromise = googleAPIPromise.then(
		async (googleAPI) =>
			googleAPI &&
			(await googleAPI.coursesTeaching())?.map((course) => ({
				...course,
				roster: googleAPI.courseRoster({ courseId: course.id }),
			}))
	)

	return <CreateClassForm coursesPromise={coursesPromise} />
}

export default ClassCreatePage
