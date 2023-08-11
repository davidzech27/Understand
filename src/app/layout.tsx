import "./global.css"
import Providers from "./providers"
import { getSignedIn } from "~/utils/getSignedIn"

export const metadata = {
	title: {
		template: "%s | Understand",
		default: "Understand",
	},
	description:
		"We give students in-depth AI feedback on their work and aggregate this feedback into nuanced and actionable insights for teachers.",
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
					className="absolute bottom-0 top-0 left-0 right-0"
					style={{ margin: 0 }} // keep this
				>
					<Providers signedIn={getSignedIn()}>{children}</Providers>
				</body>
			</html>
		</>
	)
}
