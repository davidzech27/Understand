import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm/expressions"

import { env } from "~/env.mjs"
import { setAuth } from "~/auth/jwt"
import redirectToCookieKey from "./redirectToCookieKey"
import db from "~/db/db"
import { getCredentialsFromCode } from "~/google/credentials"
import GoogleAPI from "~/google/GoogleAPI"
import User from "~/data/User"
import Course from "~/data/Course"

export const oauthCallbackHandler = async (request: NextRequest) => {
	const { searchParams } = new URL(request.url)

	const code = searchParams.get("code")

	if (typeof code !== "string") return new NextResponse(null, { status: 400 })

	const { refreshToken, scopes } = await getCredentialsFromCode(code)

	const googleAPI = await GoogleAPI({
		refreshToken,
	})

	const { email, name, photo } = await googleAPI.me()

	await User({ email }).create({ name, photo })

	let redirectTo =
		request.cookies.get(redirectToCookieKey)?.value ??
		`${env.NEXT_PUBLIC_URL}/landing`

	const response = NextResponse.redirect(new URL(redirectTo))

	await Promise.all([
		setAuth({
			cookies: response.cookies,
			auth: {
				email,
				googleRefreshToken: refreshToken,
				googleScopes: scopes,
			},
		}),
		User({ email })
			.courses()
			.then(({ teaching }) =>
				Promise.all(
					teaching.map(({ id }) =>
						Course({ id }).update({
							linkedRefreshToken: refreshToken,
						})
					)
				)
			),
	])

	return response
}
