"use client"
import Link from "next/link"
import { useState } from "react"

import { env } from "~/env.mjs"
import redirectToCookieKey from "~/auth/redirectToCookieKey"
import redirectURL from "./redirectURL"
import { type Scope } from "./scopes"

interface Props {
	children: React.ReactNode
	renderLoadingState: React.ReactNode
	scopes: Scope[]
	redirectTo: string
}

const GoogleAuthLink: React.FC<Props> = ({
	children,
	renderLoadingState,
	scopes,
	redirectTo,
}) => {
	const [loading, setLoading] = useState(false)

	const onSignIn = async () => {
		setLoading(true)

		setTimeout(() => setLoading(false), 1000)

		if (redirectTo[0] === "/")
			redirectTo = `${env.NEXT_PUBLIC_URL}${redirectTo}`

		document.cookie = `${redirectToCookieKey}=${redirectTo}`
	}

	return (
		<Link
			href={encodeURI(
				`https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${scopes.join(
					" "
				)}&prompt=consent&include_granted_scopes=true&response_type=code&client_id=${
					env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
				}&redirect_uri=${redirectURL}`
			)}
			onClick={onSignIn}
		>
			{loading ? renderLoadingState : children}
		</Link>
	)
}

export default GoogleAuthLink
