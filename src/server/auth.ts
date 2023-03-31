import { type NextApiRequest, type NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import Cookies from "cookies";
import { z } from "zod";
import { google } from "googleapis";
import { env } from "~/env.mjs";

export const redirectUrl = `${env.URL}/api/oauthcallback`;

export const authorizationCookieKey = "authorization";

export const createUnauthedOAuth2Client = () => {
	const oauth2Client = new google.auth.OAuth2(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		redirectUrl
	);

	return oauth2Client;
};

export const createAuthedOAuth2Client = ({
	accessToken,
	refreshToken,
}: {
	accessToken: string;
	refreshToken: string;
}) => {
	const oauth2Client = new google.auth.OAuth2(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		redirectUrl
	);

	oauth2Client.setCredentials({
		access_token: accessToken,
		refresh_token: refreshToken,
	});

	return oauth2Client;
};

const accessTokenPayloadSchema = z.object({
	email: z.string(),
	googleAccessToken: z.string(),
	googleRefreshToken: z.string(),
});

export const encodeAccessToken = (
	payload: z.infer<typeof accessTokenPayloadSchema>
) => jwt.sign(payload, env.JWT_SECRET);

export const decodeAccessToken = ({ accessToken }: { accessToken: string }) =>
	accessTokenPayloadSchema.parse(jwt.verify(accessToken, env.JWT_SECRET));

export const getAuth = ({
	req,
	res,
}: {
	req: NextApiRequest;
	res: NextApiResponse;
}):
	| { authed: false }
	| ({ authed: true } & z.infer<typeof accessTokenPayloadSchema>) => {
	const cookies = Cookies(req, res);

	const authorization = cookies.get(authorizationCookieKey);

	if (!authorization) return { authed: false };

	const accessToken = authorization.replace("Bearer ", "");

	try {
		const accessTokenPayload = decodeAccessToken({ accessToken });

		return {
			authed: true,
			...accessTokenPayload,
		};
	} catch {
		return { authed: false };
	}
};
