import { type NextAuthOptions, getServerSession } from "next-auth";
import { type GetServerSidePropsContext } from "next";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env.mjs";

export const authOptions: NextAuthOptions = {
	providers: [
		// GoogleProvider({
		// 	clientId: env.GOOGLE_CLIENT_ID,
		// 	clientSecret: env.GOOGLE_CLIENT_SECRET,
		// 	authorization: {
		// 		params: {
		// 			prompt: "consent",
		// 			access_type: "offline",
		// 			response_type: "code",
		// 		},
		// 	},
		// }),
	],
	callbacks: {
		signIn: ({ user }) => {
			return true;
		},
	},
};

export const getServerAuthSession = (ctx: {
	req: GetServerSidePropsContext["req"];
	res: GetServerSidePropsContext["res"];
}) => {
	return getServerSession(ctx.req, ctx.res, authOptions);
};
