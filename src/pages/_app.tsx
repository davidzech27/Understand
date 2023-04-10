import { type AppType } from "next/app";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { api } from "~/client/api";
import "~/client/globals.css";
import useCallOnce from "~/client/modules/shared/useCallOnce";
import { initMixpanel } from "~/client/modules/analytics/mixpanel";

const App: AppType = ({ Component }) => {
	useCallOnce(initMixpanel);

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
