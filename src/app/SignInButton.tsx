"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

import FancyButton from "~/components/FancyButton"

export default function SignInButton() {
	const [href, setHref] = useState<"/" | "/signIn" | "/home">("/")

	useEffect(() => {
		if (document.cookie.includes("ph_phc")) setHref("/home")
		else setHref("/signIn")
	}, [])

	return (
		<Link href={href} passHref legacyBehavior>
			<FancyButton size="medium" className="w-full md:w-fit">
				Sign in
			</FancyButton>
		</Link>
	)
}
