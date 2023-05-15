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
				"https://www.googleapis.com/auth/userinfo.email"
			) ||
			!googleScopes.includes(
				"https://www.googleapis.com/auth/userinfo.profile"
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

	const coursesPromise = googleAPIPromise.then((googleAPI) =>
		googleAPI?.coursesTeaching()
	)

	const courseRostersPromise = googleAPIPromise.then(async (googleAPI) => {
		const courses = await coursesPromise

		return googleAPI && courses
			? (
					await Promise.all(
						courses.map((course) =>
							googleAPI?.courseRoster({ courseId: course.id })
						)
					)
			  ).reduce(
					(previous, current, index) => ({
						...previous,
						[courses[index]!.id]: {
							teachers: current.teachers
								.map((teacher) => teacher.email)
								.filter(Boolean),
							students: current.students.map(
								(student) => student.email
							),
						},
					}),
					{} as Record<
						string,
						{ teachers: string[]; students: string[] }
					>
			  )
			: undefined
	})

	return (
		<CreateClassForm
			coursesPromise={coursesPromise}
			courseRostersPromise={courseRostersPromise}
		/>
	)
}

export default ClassCreatePage
