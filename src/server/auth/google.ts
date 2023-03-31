import { google } from "googleapis";
import { env } from "~/env.mjs";

export const redirectUrl = `${env.URL}/api/oauthcallback`;

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
