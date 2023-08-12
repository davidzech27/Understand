import Header from "./Header"
import Footer from "./Footer"

export default function UnauthedLayout({ children }: React.PropsWithChildren) {
	return (
		<>
			<Header />

			{children}

			<Footer />
		</>
	)
}
