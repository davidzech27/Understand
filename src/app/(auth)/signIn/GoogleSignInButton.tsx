"use client"
import Link from "next/link"
import { Roboto } from "next/font/google"

import getAuthenticationURL from "~/google/getAuthenticationURL"
import cn from "~/utils/cn"
import GoogleLogo from "~/google/GoogleLogo"

interface Props {
	className?: string
}

const roboto = Roboto({
	weight: "500",
	subsets: ["latin-ext"],
})

export default function GoogleSignInButton({ className }: Props) {
	return (
		<Link
			href={getAuthenticationURL({
				scopes: [
					"https://www.googleapis.com/auth/userinfo.email",
					"https://www.googleapis.com/auth/userinfo.profile",
				],
				redirectTo: "/landing",
			})}
			className={cn(
				"flex h-20 items-center gap-12 rounded-lg border border-border bg-white pl-[22px] pr-8 transition duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover active:bg-surface-hover",
				className
			)}
		>
			<GoogleLogo size={36} />

			<span
				className={cn(
					roboto.className,
					"text-[28px] font-medium text-black/90"
				)}
			>
				Sign in with Google
			</span>
		</Link>
	)
}
