import { type NextAuthOptions } from "next-auth";
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
