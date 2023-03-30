import NextAuth from "next-auth/next";
import { type NextAuthOptions, getServerSession } from "next-auth";
import {
	type GetServerSidePropsContext,
	type NextApiRequest,
	type NextApiResponse,
} from "next";
import GoogleProvider from "next-auth/providers/google";
import { google } from "googleapis";
import { eq } from "drizzle-orm/expressions";
import { env } from "~/env.mjs";
import db from "~/db/db";
import { user } from "~/db/schema";

declare module "next-auth" {
	interface Session {
		user: {
			email: string;
			googleAccessToken: string;
			googleRefreshToken: string;
		};
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		email: string;
		googleAccessToken: string;
		googleRefreshToken: string;
	}
}

export const redirectUrl = `${env.NEXTAUTH_URL}/api/auth/callback/google`;

export const getAuthOptions = (
	req: NextApiRequest,
	res: NextApiResponse
): NextAuthOptions => ({
	providers: [
		GoogleProvider({
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,

			authorization: {
				params: {
					scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.profile.emails https://www.googleapis.com/auth/classroom.profile.photos https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/drive.readonly",
					prompt: "consent",
					access_type: "offline",
					response_type: "code",
				},
			},
		}),
	],
	callbacks: {
		signIn: async ({ user: { email, name }, account }) => {
			if (!email) {
				console.error("No email during sign in");

				return false;
			}

			const googleRefreshToken = account?.refresh_token;

			if (googleRefreshToken && name) {
				await db
					.insert(user)
					.values({
						email,
						name,
						googleRefreshToken,
					})
					.onDuplicateKeyUpdate({
						// for when refresh token stops working and user has to sign in again
						set: {
							googleRefreshToken,
						},
					});
			} else {
				const [existingAccount] = await db
					.select()
					.from(user)
					.where(eq(user.email, email));

				if (!existingAccount) {
					console.error(
						"Missing values during first sign in for user with email: " +
							email
					);

					return false;
				}
			}

			return true;

			// refreshToken = (
			// 	await Promise.all([
			// 		db
			// 			.select({ refreshToken: teacher.refreshToken })
			// 			.from(teacher)
			// 			.where(eq(teacher.email, email)),
			// 		db
			// 			.update(teacher)
			// 			.set({
			// 				accessToken,
			// 			})
			// 			.where(eq(teacher.email, email)),
			// 	])
			// )[0][0]?.refreshToken;

			// if (!refreshToken) {
			// 	console.error(
			// 		"No refresh token supplied but user not in database"
			// 	);

			// 	return false;
			// }

			// const oauth2Client = new google.auth.OAuth2(
			// 	env.GOOGLE_CLIENT_ID,
			// 	env.GOOGLE_CLIENT_SECRET,
			// 	`${env.NEXTAUTH_URL}/api/auth/callback/google`
			// );

			// oauth2Client.setCredentials({
			// 	access_token: accessToken,
			// 	refresh_token: refreshToken,
			// });

			// const classroom = google.classroom("v1");

			// const courses = (
			// 	await classroom.courses.list({
			// 		courseStates: ["ACTIVE"],
			// 		teacherId: "me",
			// 	})
			// ).data.courses;

			// if (!courses) {
			// 	console.error("No courses found for user signing in");

			// 	return false;
			// }

			// const teacherEmail = email;

			// await db.insert(teacherCourseRelation).values(
			// 	...courses
			// 		.map((course) => {
			// 			if (!course.id) {
			// 				console.error(
			// 					"Course does not have id: " +
			// 						JSON.stringify(course)
			// 				);

			// 				return undefined;
			// 			}

			// 			return {
			// 				courseId: course.id,
			// 				teacherEmail,
			// 			};
			// 		})
			// 		.filter(undefinedTypeGuard)
			// );

			// return true;
		},
		jwt: async ({ token, account }) => {
			if (account) {
				if (!account.access_token || !account.refresh_token) {
					console.error(
						"User signing but no access token or refresh token"
					);

					throw new Error();
				}

				token.googleAccessToken = account.access_token;
				token.googleRefreshToken = account.refresh_token;
			}

			const oauth2Client = new google.auth.OAuth2(
				env.GOOGLE_CLIENT_ID,
				env.GOOGLE_CLIENT_SECRET,
				`${env.NEXTAUTH_URL}/api/auth/callback/google`
			);

			oauth2Client.setCredentials({
				access_token: token.googleAccessToken,
				refresh_token: token.googleRefreshToken,
			});

			const newAccessToken = (await oauth2Client.getAccessToken()).token;

			if (!newAccessToken) {
				console.error("Fetched access token is null or undefined");

				res.redirect("/"); // later redirect to actual sign in page

				return token;
			}

			token.googleAccessToken = newAccessToken;

			return token;
		},
		session: ({ session, token }) => {
			session.user = token;

			return session;
		},
	},
});

export const getServerAuthSession = (ctx: {
	req: NextApiRequest;
	res: NextApiResponse;
}) => {
	return getServerSession(ctx.req, ctx.res, getAuthOptions(ctx.req, ctx.res));
};
