import { type NextApiHandler } from "next";
import Cookies from "cookies";
import {
	createUnauthedOAuth2Client,
	redirectUrl,
} from "~/server/modules/auth/google";
import { google } from "googleapis";
import { authorizationCookieKey, setAuth } from "~/server/modules/auth/jwt";
import db from "~/server/modules/db/db";
import { user } from "~/server/modules/db/schema";

const redirectToCookieKey = "redirect_to";

const authHandler: NextApiHandler = async (req, res) => {
	const urlEnding = req.url?.split("/")[2]?.split("?")[0];

	if (
		urlEnding === undefined ||
		(urlEnding !== "authenticate" &&
			urlEnding !== redirectUrl.split("/").at(-1))
	)
		return res.status(400).end();

	const cookies = Cookies(req, res);

	const oauth2Client = createUnauthedOAuth2Client();

	if (urlEnding === "authenticate") {
		if (req.method !== "POST") return res.status(405).end();

		const { scopes, redirectTo } = req.body;

		if (
			typeof scopes !== "string" ||
			(typeof redirectTo !== "string" &&
				typeof redirectTo !== "undefined")
		)
			return res.status(400).end();

		cookies.set(redirectToCookieKey, redirectTo);

		const authUrl = oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: scopes,
			prompt: "consent",
			include_granted_scopes: true,
		});

		return res.send(authUrl);
	} else {
		if (req.method !== "GET") return res.status(405).end();

		const { code } = req.query;

		if (typeof code !== "string") return res.status(400).end();

		const { tokens } = await oauth2Client.getToken(code);

		oauth2Client.setCredentials(tokens);

		const classroom = google.classroom({
			version: "v1",
			auth: oauth2Client,
		});

		const {
			data: { emailAddress, name },
		} = await classroom.userProfiles.get({
			userId: "me",
		});

		if (
			!emailAddress ||
			!name?.fullName ||
			!tokens.access_token ||
			!tokens.refresh_token
		)
			return res.status(500).end();

		await db
			.insert(user)
			.values({
				email: emailAddress,
				name: name.fullName,
			})
			.onDuplicateKeyUpdate({
				set: {
					email: emailAddress, // doesn't do anything
				},
			});

		await setAuth({
			req,
			res,
			auth: {
				email: emailAddress,
				googleAccessToken: tokens.access_token,
				googleRefreshToken: tokens.refresh_token,
			},
		});

		const redirectTo = cookies.get(redirectToCookieKey);

		if (!redirectTo) return res.status(400).end();

		cookies.set(redirectToCookieKey);

		return res.redirect(redirectTo);
	}
};

export default authHandler;
