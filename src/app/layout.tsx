import { Analytics } from "@vercel/analytics/react"
import { HighlightInit } from "@highlight-run/next/highlight-init"

import { env } from "~/env.mjs"
import "./global.css"

export const metadata = {
	title: {
		template: "%s | Understand",
		default: "Understand",
	},
	description:
		"The personalized educational content and student insight platform",
	referrer: "no-referrer",
	metadataBase: new URL("https://understand.school"),
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			<HighlightInit
				projectId={env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID}
				tracingOrigins
				networkRecording={{
					enabled: true,
					recordHeadersAndBody: true,
					urlBlocklist: [],
				}}
			/>

			<html lang="en">
				<head />

				<body>
					{children}

					{env.NODE_ENV === "production" && <Analytics />}
				</body>
			</html>
		</>
	)
}

export default RootLayout
