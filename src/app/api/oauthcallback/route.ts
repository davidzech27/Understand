import { type NextRequest, type NextResponse } from "next/server"

import oauthCallbackHandler from "~/auth/oauthCallbackHandler"

export const runtime = "edge"

export const GET = oauthCallbackHandler as (
	request: NextRequest
) => NextResponse
