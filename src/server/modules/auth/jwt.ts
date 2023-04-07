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

const encodeAccessToken = async (
	payload: z.infer<typeof accessTokenPayloadSchema>
) =>
	await new jose.SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.sign(new TextEncoder().encode(env.JWT_SECRET));

const decodeAccessToken = async ({ accessToken }: { accessToken: string }) =>
	accessTokenPayloadSchema.parse(
		(
			await jose.jwtVerify(
				accessToken,
				new TextEncoder().encode(env.JWT_SECRET)
			)
		).payload
	);

export const getAuth = async (
	args:
		| {
				req: NextApiRequest;
				res: NextApiResponse;
		  }
		| { authorization: string }
): Promise<z.infer<typeof accessTokenPayloadSchema> | undefined> => {
	let authorization: string;

	if ("req" in args) {
		const { req, res } = args;

		const cookies = Cookies(req, res);

		const authorizationCookie = cookies.get(authorizationCookieKey);

		if (!authorizationCookie) return undefined;

		authorization = authorizationCookie;
	} else {
		authorization = args.authorization;
	}

	const accessToken = authorization.replace("Bearer ", "");

	try {
		const accessTokenPayload = await decodeAccessToken({
			accessToken,
		});

		return accessTokenPayload;
	} catch {
		return undefined;
	}
};

export const setAuth = async ({
	req,
	res,
	auth,
}: {
	req: NextApiRequest;
	res: NextApiResponse;
	auth: z.infer<typeof accessTokenPayloadSchema>;
}) => {
	const accessToken = await encodeAccessToken(auth);

	const authorization = `Bearer ${accessToken}`;

	const cookies = Cookies(req, res);

	cookies.set(authorizationCookieKey, authorization, { sameSite: true });
};
