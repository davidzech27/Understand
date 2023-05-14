"use client"
import Link from "next/link"

interface Props {
	children: React.ReactNode
}

const GetStartedLink: React.FC<Props> = ({ children }) => {
	return (
		<div className="h-16">
			<Link
				href={
					typeof localStorage !== "undefined" &&
					localStorage.getItem("hightlight-identified") === "true"
						? "/home"
						: "/signIn"
				}
				legacyBehavior
			>
				<a>{children} </a>
			</Link>
		</div>
	)
}

export default GetStartedLink
