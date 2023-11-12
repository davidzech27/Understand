import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { getAuth } from "~/auth/jwt"
import redirectToCookieKey from "~/auth/redirectToCookieKey"

export const config = {
	matcher: ["/((?=home|profile|class|assignment|landing).+)"],
}

export const middleware = async (request: NextRequest) => {
	if ((await getAuth({ cookies: request.cookies })) === undefined) {
		const response = NextResponse.redirect(
			new URL(
				`${request.nextUrl.protocol}//${request.nextUrl.host}/signIn`,
			),
		)

		response.cookies.set(redirectToCookieKey, request.url)

		return response
	}

	return NextResponse.next()
}

export default middleware
