import { oauthCallbackHandler } from "~/auth/authEdgeRoute"

export const runtime = "edge"

export const GET = oauthCallbackHandler
