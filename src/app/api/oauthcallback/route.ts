import { oauthCallbackHandler } from "~/auth/edgeRoute"

export const runtime = "edge"

export const GET = oauthCallbackHandler
