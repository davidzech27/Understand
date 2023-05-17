import { Analytics } from "@vercel/analytics/react"
import { ErrorBoundary } from "./sentry"

import "./global.css"
import { env } from "~/env.mjs"

export const metadata = {
	title: {
		template: "%s | Understand",
		default: "Understand",
	},
	description:
		"The personalized educational content and student insight platform",
	referrer: "no-referrer",
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<html lang="en">
			<head />

			<body>
				<ErrorBoundary>{children}</ErrorBoundary>

				{env.NODE_ENV === "production" && <Analytics />}
			</body>
		</html>
	)
}

export default RootLayout
