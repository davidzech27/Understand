import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { google } from "googleapis";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getAuth, setAuth } from "./modules/auth/jwt";
import { createAuthedOAuth2Client } from "./modules/auth/google";

export const createContext = async ({
	req,
	res,
}: CreateNextContextOptions) => ({
	req,
	res,
});

const t = initTRPC.context<typeof createContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError
						? error.cause.flatten()
						: null,
			},
		};
	},
});

export const createRouter = t.router;

export const publicProcedure = t.procedure;

const isAuthed = t.middleware(async ({ ctx: { req, res }, next }) => {
	const auth = await getAuth({ req, res });

	if (!auth) throw new TRPCError({ code: "UNAUTHORIZED" });

	const { email, googleAccessToken, googleRefreshToken } = auth;

	const oauth2Client = createAuthedOAuth2Client({
		accessToken: googleAccessToken,
		refreshToken: googleRefreshToken,
	});

	oauth2Client.setCredentials({
		...oauth2Client.credentials,
		access_token: (await oauth2Client.getAccessToken()).token,
	});

	if (
		oauth2Client.credentials.access_token !== googleAccessToken &&
		oauth2Client.credentials.access_token
	) {
		await setAuth({
			req,
			res,
			auth: {
				email,
				googleAccessToken: oauth2Client.credentials.access_token,
				googleRefreshToken,
			},
		});
	}

	const classroom = google.classroom({ version: "v1", auth: oauth2Client });

	const drive = google.drive({ version: "v3", auth: oauth2Client });

	return next({
		ctx: {
			email,
			classroom,
			drive,
			req,
			res,
		},
	});
});

export const authedProcedure = t.procedure.use(isAuthed);
