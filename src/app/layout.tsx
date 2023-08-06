import "./global.css"
import Providers from "./providers"

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

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<html lang="en">
				<head />

				<body className="absolute bottom-0 top-0 left-0 right-0">
					<Providers>{children}</Providers>
				</body>
			</html>
		</>
	)
}
