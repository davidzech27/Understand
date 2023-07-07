"use client"
import Link from "next/link"

import FancyButton from "~/components/FancyButton"

const GetStartedButton = () => {
	return (
		<Link
			href={
				typeof localStorage !== "undefined" &&
				localStorage.getItem("landed-2.0") === "true"
					? "/home"
					: "/signIn"
			}
			legacyBehavior
		>
			<a>
				<FancyButton size="medium">Get started</FancyButton>
			</a>
		</Link>
	)
}

export default GetStartedButton
