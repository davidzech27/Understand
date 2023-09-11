import { type NextRequest, type NextResponse } from "next/server"

import openaiHandler from "~/ai/openAIHandler"

export const runtime = "edge"

export const POST = openaiHandler as (request: NextRequest) => NextResponse
