"use client"
import Link from "next/link"

import FancyButton from "~/components/FancyButton"

const GetStartedButton = () => {
	return (
		<Link
			href={
				typeof localStorage !== "undefined" &&
				localStorage.getItem("landed") === "true"
					? "/home"
					: "/signIn"
			}
			legacyBehavior
		>
			<a>
				<FancyButton className="px-12 text-2xl">
					Get started
				</FancyButton>
			</a>
		</Link>
	)
}

export default GetStartedButton
