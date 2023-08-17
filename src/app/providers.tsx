"use client"
import { SignedInProvider, setSignedIn } from "~/utils/useSignedIn"

interface Props extends React.PropsWithChildren {
	signedIn: boolean
}

export default function Providers({ signedIn, children }: Props) {
	return (
		<SignedInProvider value={{ signedIn, setSignedIn }}>
			{children}
		</SignedInProvider>
	)
}
