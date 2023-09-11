import { type NextRequest, type NextResponse } from "next/server"

import countTokensHandler from "~/ai/countTokensHandler"

export const POST = countTokensHandler as (request: NextRequest) => NextResponse
