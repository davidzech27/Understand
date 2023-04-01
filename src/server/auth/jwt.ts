import { type NextApiRequest, type NextApiResponse } from "next";
import * as jose from "jose";
import Cookies from "cookies";
import { z } from "zod";
import { env } from "~/env.mjs";

export const authorizationCookieKey = "authorization";

const accessTokenPayloadSchema = z.object({
	email: z.string(),
	googleAccessToken: z.string(),
	googleRefreshToken: z.string(),
});

export const encodeAccessToken = async (
	payload: z.infer<typeof accessTokenPayloadSchema>
) =>
	await new jose.SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.sign(new TextEncoder().encode(env.JWT_SECRET));

export const decodeAccessToken = async ({
	accessToken,
}: {
	accessToken: string;
}) =>
	accessTokenPayloadSchema.parse(
		(
			await jose.jwtVerify(
				accessToken,
				new TextEncoder().encode(env.JWT_SECRET)
			)
		).payload
	);

export const getAuth = async ({
	req,
	res,
}: {
	req: NextApiRequest;
	res: NextApiResponse;
}): Promise<z.infer<typeof accessTokenPayloadSchema> | undefined> => {
	const cookies = Cookies(req, res);

	const authorization = cookies.get(authorizationCookieKey);

	if (!authorization) return undefined;

	const accessToken = authorization.replace("Bearer ", "");

	try {
		const accessTokenPayload = await decodeAccessToken({ accessToken });

		return accessTokenPayload;
	} catch {
		return undefined;
	}
};
