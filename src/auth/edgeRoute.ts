import { NextRequest, NextResponse } from "next/server"

import { env } from "~/env.mjs"
import { setAuth } from "~/auth/jwt"
import redirectToCookieKey from "./redirectToCookieKey"
import db from "~/db/db"
import { getCredentialsFromCode } from "~/google/credentials"
import GoogleAPI from "~/google/GoogleAPI"
import User from "~/data/User"

export const oauthCallbackHandler = async (request: NextRequest) => {
	const { searchParams } = new URL(request.url)

	const code = searchParams.get("code")

	if (typeof code !== "string") return new NextResponse(null, { status: 400 })

	const { accessToken, refreshToken, expiresMillis, scopes } =
		await getCredentialsFromCode(code)

	const googleAPI = await GoogleAPI({
		accessToken,
		refreshToken,
		expiresMillis,
		onRefreshAccessToken: () => {},
	})

	const { email, name, photo } = await googleAPI.me()

	await User({ email }).create({ name, photo })

	let redirectTo =
		request.cookies.get(redirectToCookieKey)?.value ??
		`${env.NEXT_PUBLIC_URL}/landing`

	const response = NextResponse.redirect(new URL(redirectTo))

	await setAuth({
		cookies: response.cookies,
		auth: {
			email,
			googleAccessToken: accessToken,
			googleRefreshToken: refreshToken,
			googleRefreshTokenExpiresMillis: expiresMillis,
			googleScopes: scopes,
		},
	})

	return response
}
