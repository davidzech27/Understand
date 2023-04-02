import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizationCookieKey, getAuth } from "./server/auth/jwt";

export const middleware = async (request: NextRequest) => {
	if (
		request.nextUrl.pathname !== "/" &&
		request.nextUrl.pathname !== "/signIn" &&
		request.nextUrl.pathname !== "/landing" && // because authorization cookie isn't sent on redirect from oauthcallback
		!request.nextUrl.pathname.startsWith("/api") &&
		!request.nextUrl.pathname.startsWith("/_") // SUPER important
	) {
		const authorization = request.cookies.get(
			authorizationCookieKey
		)?.value;

		if (
			!authorization ||
			(await getAuth({ authorization })) === undefined
		) {
			console.log("111111111", request.nextUrl.pathname, authorization);
			return NextResponse.redirect(
				new URL(
					`${request.nextUrl.protocol}//${request.nextUrl.host}/signIn`
				)
			);
		}
	}

	if (
		request.nextUrl.pathname === "/course" ||
		request.nextUrl.pathname === "/assignment" ||
		request.nextUrl.pathname === "/student"
	) {
		return NextResponse.rewrite(
			new URL(`${request.nextUrl.protocol}//${request.nextUrl.host}/404`)
		);
	}

	if (request.nextUrl.pathname.indexOf("/assignment/") !== -1)
		return NextResponse.rewrite(
			new URL(
				`${request.nextUrl.protocol}//${request.nextUrl.host}/assignment`
			)
		);

	if (request.nextUrl.pathname.indexOf("/student/") !== -1)
		return NextResponse.rewrite(
			new URL(
				`${request.nextUrl.protocol}//${request.nextUrl.host}/student`
			)
		);

	if (request.nextUrl.pathname.indexOf("/feedback/") !== -1)
		return NextResponse.rewrite(
			new URL(
				`${request.nextUrl.protocol}//${request.nextUrl.host}/feedback`
			)
		);

	//! must be below other routes that begin with /course
	if (request.nextUrl.pathname.startsWith("/course"))
		return NextResponse.rewrite(
			new URL(
				`${request.nextUrl.protocol}//${request.nextUrl.host}/course`
			)
		);
};
