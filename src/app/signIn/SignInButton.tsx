"use client"
import Link from "next/link"
import FancyButton from "~/components/FancyButton"

import getAuthenticationURL from "~/google/getAuthenticationURL"

const SignInButton = () => {
return (
	<Link
		href={getAuthenticationURL({
			scopes: [
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			],
			redirectTo: "/landing",
		})}
		legacyBehavior
	>
		<a>
			<FancyButton className="h-20 text-3xl">Sign in</FancyButton>
		</a>
	</Link>
)

}

export default SignInButton