"use client"
import Link from "next/link"

import useSignedIn from "~/utils/useSignedIn"
import FancyButton from "~/components/FancyButton"
import GradientText from "~/components/GradientText"

export default function CTAButtons() {
	const { signedIn } = useSignedIn()

	return (
		<>
			{!signedIn ? (
				<Link href="/signIn" passHref className="mobile:w-full">
					<FancyButton size="medium" className="h-16 mobile:w-full">
						Claim your account
					</FancyButton>
				</Link>
			) : (
				<Link href="/home" passHref className="mobile:w-full">
					<FancyButton size="medium" className="h-16 mobile:w-full">
						Dashboard
					</FancyButton>
				</Link>
			)}

			<GradientText asChild>
				<span
					onClick={() => {
						window.scrollTo({
							top: window.innerHeight,
							behavior: "smooth",
						})
					}}
					role="button"
					className="cursor-pointer text-2xl font-bold transition-opacity duration-150 hover:opacity-75 mobile:mb-6"
				>
					Learn more
				</span>
			</GradientText>
		</>
	)
}
