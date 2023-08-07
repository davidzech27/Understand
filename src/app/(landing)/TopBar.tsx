"use client"
import env from "env.mjs"
import colors from "colors.cjs"
import GradientText from "~/components/GradientText"
import FancyButton from "~/components/FancyButton"
import SignInLink from "./SignInLink"

export default function TopBar() {
	return (
		<div className="fixed top-0 left-0 right-0 z-10 flex h-20 items-center justify-between bg-white/70 px-4 py-2.5 backdrop-blur-xl md:px-6">
			<div className="flex h-full items-center">
				<button
					onClick={() => {
						window.scrollTo({ top: 0, behavior: "smooth" })
					}}
					style={{
						background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary} 100%)`,
					}}
					className="flex aspect-square h-[calc(100%-8px)] items-center justify-center rounded-[10px] text-3xl font-bold leading-none text-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
				>
					U
				</button>
			</div>

			<div className="flex h-full items-center gap-4 md:gap-6">
				<SignInLink>
					<a>
						<GradientText className="cursor-pointer text-base font-bold transition hover:opacity-75 focus-visible:opacity-75 active:opacity-75 md:text-xl">
							Sign in
						</GradientText>
					</a>
				</SignInLink>

				<a href={env.NEXT_PUBLIC_BOOK_MEETING_URL}>
					<FancyButton
						size="small"
						className="h-full text-sm md:text-lg"
					>
						Book a meeting
					</FancyButton>
				</a>
			</div>
		</div>
	)
}
