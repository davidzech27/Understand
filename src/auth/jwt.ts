import { type ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies"
import * as jose from "jose"
import { z } from "zod"

import scopes from "~/google/scopes"
import { env } from "~/env.mjs"

const authorizationCookieKey = "Authorization"

const accessTokenPayloadSchema = z.object({
	email: z.string(),
	googleRefreshToken: z.string(),
	googleScopes: z.enum(scopes).array(),
})

const encodeAccessToken = async (
	payload: z.infer<typeof accessTokenPayloadSchema>
) =>
	await new jose.SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.sign(new TextEncoder().encode(env.JWT_SECRET))

const decodeAccessToken = async ({ accessToken }: { accessToken: string }) =>
	accessTokenPayloadSchema.parse(
		(
			await jose.jwtVerify(
				accessToken,
				new TextEncoder().encode(env.JWT_SECRET)
			)
		).payload
	)

export const getAuth = async ({
	cookies,
}: {
	cookies: { get: (key: string) => { value: string } | undefined }
}) => {
	const authorization = cookies.get(authorizationCookieKey)?.value

	if (authorization === undefined) return undefined

	const accessToken = authorization.replace("Bearer ", "")

	try {
		const accessTokenPayload = await decodeAccessToken({
			accessToken,
		})

		return accessTokenPayload
	} catch (error) {
		return undefined
	}
}

export const getAuthOrThrow = async ({
	cookies,
}: {
	cookies: { get: (key: string) => { value: string } | undefined }
}) => {
	const auth = await getAuth({ cookies })

	if (auth === undefined) throw new Error("Unauthenticated")

	return auth
}

export const setAuth = async ({
	auth,
	cookies,
}: {
	auth: z.infer<typeof accessTokenPayloadSchema>
	cookies: ResponseCookies
}) => {
	const accessToken = await encodeAccessToken(auth)

	const authorization = `Bearer ${accessToken}`

	cookies.set({
		name: authorizationCookieKey,
		value: authorization,
		httpOnly: true,
		sameSite: "lax",
		expires: new Date().valueOf() + 1000 * 60 * 60 * 24 * 400,
		secure: env.NODE_ENV === "production",
	})
}
