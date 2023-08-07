import "./global.css"
import Providers from "./providers"

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

				<body>
					<Providers>{children}</Providers>
				</body>
			</html>
		</>
	)
}
