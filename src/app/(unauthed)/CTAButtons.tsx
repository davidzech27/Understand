"use client"
import Link from "next/link"

import env from "env.mjs"
import useSignedIn from "~/utils/useSignedIn"
import FancyButton from "~/components/FancyButton"
import GradientText from "~/components/GradientText"

export default function CTAButtons() {
	const { signedIn } = useSignedIn()

	return (
		<>
			{!signedIn ? (
				<a
					href={env.NEXT_PUBLIC_BOOK_MEETING_URL}
					target="_blank"
					rel="noreferrer"
					className="mobile:w-full"
				>
					<FancyButton size="medium" className="h-16 mobile:w-full">
						Book a meeting
					</FancyButton>
				</a>
			) : (
				<Link href="/home" passHref className="mobile:w-full">
					<FancyButton size="medium" className="h-16 mobile:w-full">
						Dashboard
					</FancyButton>
				</Link>
			)}
			{!signedIn ? (
				<Link href="/signIn" passHref>
					<GradientText className="cursor-pointer select-none text-2xl font-bold transition-opacity duration-150 hover:opacity-75 mobile:mb-6">
						Sign in
					</GradientText>
				</Link>
			) : (
				<GradientText asChild>
					<a
						href={env.NEXT_PUBLIC_BOOK_MEETING_URL}
						target="_blank"
						rel="noreferrer"
						className="cursor-pointer select-none text-2xl font-bold transition-opacity duration-150 hover:opacity-75 mobile:mb-6"
					>
						Book a meeting
					</a>
				</GradientText>
			)}
		</>
	)
}
