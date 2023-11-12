import { z } from "zod"

import redirectURL from "./redirectURL"
import scopes from "./scopes"
import env from "~/env.mjs"

const tokensSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresMillis: z.number(),
	scopes: z.enum(scopes).array(),
})

export async function getCredentialsFromCode(code: string) {
	const tokens = (await (
		await fetch("https://accounts.google.com/o/oauth2/token", {
			method: "POST",
			body: JSON.stringify({
				client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
				client_secret: env.GOOGLE_CLIENT_SECRET,
				redirect_uri: redirectURL,
				code,
				grant_type: "authorization_code",
			}),
		})
	).json()) as
		| {
				access_token: unknown
				refresh_token: unknown
				expires_in: unknown
				scope: unknown
		  }
		| undefined

	if (tokens === undefined) throw new Error("No Google tokens")

	return tokensSchema.parse({
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		expiresMillis:
			typeof tokens.expires_in === "number" &&
			new Date().valueOf() + (tokens.expires_in - 10) * 1000,
		scopes:
			typeof tokens.scope === "string" &&
			tokens.scope.split(" ").filter((scope) => scopes.includes(scope)),
	})
}

export async function getCredentialsFromRefreshToken(refreshToken: string) {
	const tokens = (await (
		await fetch("https://accounts.google.com/o/oauth2/token", {
			method: "POST",
			body: JSON.stringify({
				client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
				client_secret: env.GOOGLE_CLIENT_SECRET,
				refresh_token: refreshToken,
				grant_type: "refresh_token",
			}),
		})
	).json()) as
		| {
				access_token: unknown
				refresh_token: unknown
				expires_in: unknown
				scope: unknown
		  }
		| undefined

	if (tokens === undefined) throw new Error("No Google tokens")

	if ("error" in tokens && typeof tokens.error === "string")
		throw new Error(
			`Google credentials error: ${tokens.error}${
				"error_description" in tokens &&
				typeof tokens.error_description === "string"
					? `: ${tokens.error_description}`
					: ""
			}`,
		)

	return tokensSchema.parse({
		accessToken: tokens?.access_token,
		refreshToken,
		expiresMillis:
			typeof tokens?.expires_in === "number" &&
			new Date().valueOf() + (tokens.expires_in - 10) * 1000,
		scopes:
			typeof tokens?.scope === "string" &&
			tokens.scope.split(" ").filter((scope) => scopes.includes(scope)),
	})
}
