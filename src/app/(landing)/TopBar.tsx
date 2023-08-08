import Link from "next/link"

import env from "env.mjs"
import colors from "colors.cjs"
import useSignedIn from "~/utils/useSignedIn"
import GradientText from "~/components/GradientText"
import FancyButton from "~/components/FancyButton"

export default function TopBar() {
	const { signedIn } = useSignedIn()

	return (
		<>
			<header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white/70 px-8 py-4 backdrop-blur-xl sm-mobile:px-6">
				<button
					onClick={() => {
						window.scrollTo({ top: 0, behavior: "smooth" })
					}}
					style={{
						background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary} 100%)`,
					}}
					className="hidden aspect-square h-11 items-center justify-center rounded-[10px] text-[27px] font-bold leading-none text-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75 mobile:flex"
				>
					U
				</button>

				<GradientText asChild>
					<div
						onClick={() => {
							window.scrollTo({ top: 0, behavior: "smooth" })
						}}
						className="cursor-pointer text-3xl font-extrabold leading-none tracking-tight transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75 mobile:hidden"
					>
						Understand
					</div>
				</GradientText>

				<div className="flex h-full items-center space-x-6 mobile:space-x-4">
					{!signedIn ? (
						<Link href="/signIn" passHref>
							<GradientText className="cursor-pointer text-xl font-bold transition hover:opacity-75 focus-visible:opacity-75 active:opacity-75 mobile:text-lg">
								Sign in
							</GradientText>
						</Link>
					) : (
						<GradientText asChild>
							<a
								href={env.NEXT_PUBLIC_BOOK_MEETING_URL}
								target="_blank"
								rel="noreferrer"
								className="cursor-pointer text-xl font-bold transition hover:opacity-75 focus-visible:opacity-75 active:opacity-75 mobile:text-lg"
							>
								Book a meeting
							</a>
						</GradientText>
					)}

					{!signedIn ? (
						<a
							href={env.NEXT_PUBLIC_BOOK_MEETING_URL}
							target="_blank"
							rel="noreferrer"
						>
							<FancyButton
								size="small"
								className="mobile:text-base"
							>
								Book a meeting
							</FancyButton>
						</a>
					) : (
						<Link href="/home" passHref>
							<FancyButton
								size="small"
								className="sm-mobile:px-4 lg-mobile:px-5 mobile:text-base"
							>
								Dashboard
							</FancyButton>
						</Link>
					)}
				</div>
			</header>
		</>
	)
}
