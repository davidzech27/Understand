import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = (request: NextRequest) => {
	if (request.nextUrl.pathname === "/course") {
		return NextResponse.redirect(
			new URL(`${request.nextUrl.protocol}//${request.nextUrl.host}/home`)
		);
	}

	if (request.nextUrl.pathname.startsWith("/course"))
		return NextResponse.rewrite(
			new URL(
				`${request.nextUrl.protocol}//${request.nextUrl.host}/course`
			)
		);
};
