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

const RootLayout = ({ children }: { children: React.ReactNode }) => {
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

export default RootLayout
