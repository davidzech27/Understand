import { NextRequest, NextResponse } from "next/server"
import { withAxiom, type Logger } from "next-axiom"

import env from "env.mjs"
import { setAuth } from "~/auth/jwt"
import redirectToCookieKey from "./redirectToCookieKey"
import { getCredentialsFromCode } from "~/google/credentials"
import GoogleAPI from "~/google/GoogleAPI"
import User from "~/data/User"
import Course from "~/data/Course"

export default withAxiom(async function oauthCallbackHandler(
	request: NextRequest & { log: Logger }
) {
	const { searchParams } = new URL(request.url)

	const error = searchParams.get("error")

	if (error !== null) {
		request.log.error("OAuth callback error", { error })

		return NextResponse.redirect("/signIn")
	}

	const code = searchParams.get("code")

	if (typeof code !== "string") return new NextResponse(null, { status: 400 })

	const { refreshToken, scopes } = await getCredentialsFromCode(code)

	const googleAPI = await GoogleAPI({
		refreshToken,
	})

	const { email, name, photo } = await googleAPI.me()

	const existingUserPromise = User({ email }).get()

	await User({ email }).create({ name, photo })

	const redirectTo =
		request.cookies.get(redirectToCookieKey)?.value ??
		`${env.NEXT_PUBLIC_URL}/landing`

	const response = NextResponse.redirect(new URL(redirectTo))

	await Promise.all([
		existingUserPromise.then((existingUser) => {
			setAuth({
				cookies: response.cookies,
				auth: {
					email,
					googleRefreshToken: refreshToken,
					googleScopes: scopes,
					school:
						existingUser &&
						existingUser.schoolDistrictName !== undefined &&
						existingUser.schoolName !== undefined
							? {
									districtName:
										existingUser.schoolDistrictName,
									name: existingUser.schoolName,
									role: existingUser.schoolRole,
							  }
							: undefined,
				},
			})

			if (existingUser === undefined)
				request.log.info("New user", { email, name, photo })
		}),
		scopes.includes(
			"https://www.googleapis.com/auth/classroom.courses.readonly"
		) &&
			scopes.includes(
				"https://www.googleapis.com/auth/classroom.rosters.readonly"
			) &&
			scopes.includes(
				"https://www.googleapis.com/auth/classroom.profile.emails"
			) &&
			scopes.includes(
				"https://www.googleapis.com/auth/classroom.student-submissions.students.readonly"
			) &&
			scopes.includes(
				"https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly"
			) &&
			scopes.includes("https://www.googleapis.com/auth/drive.readonly") &&
			User({ email })
				.coursesTeaching()
				.then((coursesTeaching) =>
					Promise.all(
						coursesTeaching.map(({ id }) =>
							Course({ id }).update({
								syncedRefreshToken: refreshToken,
							})
						)
					)
				),
	])

	return response
})
