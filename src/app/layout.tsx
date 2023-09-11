import { AxiomWebVitals } from "next-axiom"
import { Analytics } from "@vercel/analytics/react"

import "./global.css"
import Providers from "./providers"
import { getSignedIn } from "~/utils/getSignedIn"

export const preferredRegion = "global"

export const metadata = {
	title: {
		template: "%s | Understand",
		default: "Understand",
	},
	description:
		"Empowering students to resolve issues in their own work and teachers to pinpoint their students' strengths and weaknesses as they arise, unprecedented levels of differentiation are made possible with Understand.",
	referrer: "no-referrer",
	metadataBase: new URL("https://understand.school"),
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<html lang="en">
				<head />

				<body
					className="absolute bottom-0 left-0 right-0 top-0"
					style={{ margin: 0 }} // keep this
				>
					<Providers signedIn={getSignedIn()}>{children}</Providers>

					<AxiomWebVitals />

					<Analytics />
				</body>
			</html>
		</>
	)
}
