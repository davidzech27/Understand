import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = (request: NextRequest) => {
	if (
		request.nextUrl.pathname === "/course" ||
		request.nextUrl.pathname === "/assignment" ||
		request.nextUrl.pathname === "/student"
	) {
		return NextResponse.redirect(
			new URL(`${request.nextUrl.protocol}//${request.nextUrl.host}/home`) // later rewrite to 404 page
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

	//! must be below other routes that begin with /course
	if (request.nextUrl.pathname.startsWith("/course"))
		return NextResponse.rewrite(
			new URL(
				`${request.nextUrl.protocol}//${request.nextUrl.host}/course`
			)
		);
};
