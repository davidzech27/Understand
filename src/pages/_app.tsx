import { type AppType } from "next/app";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { api } from "~/lib/trpc";
import "~/styles/globals.css";

const App: AppType = ({ Component }) => {
	return (
		<>
			<Head>
				<meta name="referrer" content="no-referrer" />
			</Head>

			<Component />

			<Analytics />
		</>
	);
};

export default api.withTRPC(App);
