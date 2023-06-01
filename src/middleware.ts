import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { getAuth } from "~/auth/jwt"

export const config = {
	matcher: ["/((?=home|class|assignment).+)"],
}

const middleware = async (request: NextRequest) => {
	if ((await getAuth({ cookies: request.cookies })) === undefined)
		return NextResponse.redirect(
			new URL(
				`${request.nextUrl.protocol}//${request.nextUrl.host}/signIn`
			)
		)

	return NextResponse.next()
}

export default middleware
