import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";

import { api } from "~/lib/api";

import "~/styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps: { session, ...pageProps },
}) => {
	return (
		<>
			<Head>
				<meta name="referrer" content="no-referrer" />
			</Head>

			<SessionProvider session={session}>
				<Component {...pageProps} />
			</SessionProvider>
		</>
	);
};

export default api.withTRPC(MyApp);
