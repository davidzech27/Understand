import { type AppType } from "next/app";
import Head from "next/head";
import { H } from "highlight.run";
import { ErrorBoundary } from "@highlight-run/react";
import { SSRProvider } from "react-aria";
import { Analytics } from "@vercel/analytics/react";
import { env } from "~/env.mjs";
import { api } from "~/client/api";
import "~/client/globals.css";

H.init(env.NEXT_PUBLIC_HIGHLIGHT_PRODUCT_ID, {
	tracingOrigins: true,
	networkRecording: {
		enabled: true,
		recordHeadersAndBody: true,
	},
	environment: env.NEXT_PUBLIC_ENVIRONMENT,
});

const App: AppType = ({ Component }) => {
	return (
		<>
			<Head>
				<meta name="referrer" content="no-referrer" />
			</Head>

			<ErrorBoundary
				customDialog={
					<main className="h-screen w-screen select-text bg-black p-[20vw] text-5xl font-medium text-white">
						There has been an error! We&apos;ll probably fix this
						soon. In the meantime, try refreshing the page, or
						perhaps signing in again.
					</main>
				}
			>
				<SSRProvider>
					<Component />
				</SSRProvider>
			</ErrorBoundary>

			<Analytics />
		</>
	);
};

export default api.withTRPC(App);
