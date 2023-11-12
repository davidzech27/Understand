"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

import env from "~/env.mjs"
import colors from "colors.cjs"
import useSignedIn from "~/utils/useSignedIn"
import GradientText from "~/components/GradientText"
import FancyButton from "~/components/FancyButton"

export default function Header() {
	const { signedIn } = useSignedIn()

	const router = useRouter()

	const pathname = usePathname()

	return (
		<>
			<header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-white/70 px-8 py-4 backdrop-blur-xl sm-mobile:px-6">
				<button
					onClick={() => {
						if (pathname === "/")
							window.scrollTo({ top: 0, behavior: "smooth" })
						else router.push("/")
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
							if (pathname === "/")
								window.scrollTo({ top: 0, behavior: "smooth" })
							else router.push("/")
						}}
						className="cursor-pointer text-3xl font-extrabold leading-none tracking-tight transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75 mobile:hidden"
					>
						Understand
					</div>
				</GradientText>

				<nav className="flex h-full items-center space-x-6 mobile:space-x-4">
					<GradientText asChild>
						<a
							href={env.NEXT_PUBLIC_BOOK_MEETING_URL}
							target="_blank"
							rel="noreferrer"
							className="cursor-pointer text-xl font-bold transition hover:opacity-75 focus-visible:opacity-75 active:opacity-75 mobile:text-lg"
						>
							Contact us
						</a>
					</GradientText>

					{!signedIn ? (
						<Link href="/signIn" passHref>
							<FancyButton
								size="small"
								className="sm-mobile:px-4 lg-mobile:px-5 mobile:text-base"
							>
								Free for teachers
							</FancyButton>
						</Link>
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
				</nav>
			</header>
		</>
	)
}
