"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function SignInLink({ children }: React.PropsWithChildren) {
	const [href, setHref] = useState<"/" | "/signIn" | "/home">("/")

	useEffect(() => {
		if (document.cookie.includes("ph_phc")) setHref("/home")
		else setHref("/signIn")
	}, [])

	return (
		<Link href={href} passHref legacyBehavior>
			{children}
		</Link>
	)
}
