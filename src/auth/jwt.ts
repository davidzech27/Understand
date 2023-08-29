import { type ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies"
import * as jose from "jose"
import { z } from "zod"

import scopes from "~/google/scopes"
import env from "env.mjs"

const authorizationCookieKey = "Authorization"

const accessTokenPayloadSchema = z.object({
	email: z.string(),
	googleRefreshToken: z.string(),
	googleScopes: z.enum(scopes).array(),
	school: z
		.object({
			districtName: z.string(),
			name: z.string(),
			role: z.enum(["teacher", "student"]).optional(),
		})
		.optional(),
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

export async function getAuth({
	cookies,
}: {
	cookies: { get: (key: string) => { value: string } | undefined }
}) {
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

export async function getAuthOrThrow({
	cookies,
}: {
	cookies: { get: (key: string) => { value: string } | undefined }
}) {
	const auth = await getAuth({ cookies })

	if (auth === undefined) throw new Error("Unauthenticated")

	return auth
}

export async function setAuth({
	auth,
	cookies,
}: {
	auth: z.infer<typeof accessTokenPayloadSchema>
	cookies: ResponseCookies
}) {
	const accessToken = await encodeAccessToken(auth)

	const authorization = `Bearer ${accessToken}`

	cookies.set({
		name: authorizationCookieKey,
		value: authorization,
		httpOnly: true,
		sameSite: true,
		expires: new Date().valueOf() + 1000 * 60 * 60 * 24 * 400,
		secure: env.NODE_ENV === "production",
	})
}
