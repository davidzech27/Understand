import { useEffect } from "react";
import { type AppType } from "next/app";
import Head from "next/head";
import { SSRProvider } from "react-aria";
import { Analytics } from "@vercel/analytics/react";
import { api } from "~/client/api";
import "~/client/globals.css";
import { initMixpanel } from "~/client/modules/analytics/mixpanel";

const App: AppType = ({ Component }) => {
	useEffect(initMixpanel, []);

	return (
		<>
			<Head>
				<meta name="referrer" content="no-referrer" />
			</Head>

			<SSRProvider>
				<Component />
			</SSRProvider>

			<Analytics />
		</>
	);
};

export default api.withTRPC(App);
