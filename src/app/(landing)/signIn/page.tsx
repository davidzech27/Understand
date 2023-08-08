import Link from "next/link"

import colors from "colors.cjs"
import getAuthenticationURL from "~/google/getAuthenticationURL"
import FancyButton from "~/components/FancyButton"

export const metadata = {
	title: "Sign in",
}

export const runtime = "edge"

export default function SignInPage() {
	return (
		<main
			style={{
				background: `linear-gradient(45deg, ${colors.primary} 25%, ${colors.secondary} 100%) border-box`,
			}}
			className="flex h-screen w-full p-6"
		>
			<div className="flex flex-1 flex-col">
				<div className="mx-auto mb-5 hidden w-fit text-center text-4xl font-bold leading-none tracking-tight text-white mobile:flex">
					Understand
				</div>

				<div className="flex h-full w-full flex-col space-y-12 rounded-lg border-[0.5px] border-border bg-white p-6 shadow-xl shadow-[#00000016] mobile:justify-between mobile:space-y-0 mobile:pt-10">
					<div className="flex-[0.875] mobile:hidden" />

					<h1 className="select-text text-center text-3xl font-semibold tracking-tight text-black/80 mobile:text-2xl">
						Sign in with your school Google account
					</h1>

					<Link
						href={getAuthenticationURL({
							scopes: [
								"https://www.googleapis.com/auth/userinfo.email",
								"https://www.googleapis.com/auth/userinfo.profile",
							],
							redirectTo: "/landing",
						})}
						passHref
					>
						<FancyButton
							size="large"
							className="sm-mobile:text-2xl"
						>
							Sign in with Google
						</FancyButton>
					</Link>

					<div className="flex-1 mobile:hidden" />
				</div>
			</div>

			<div className="flex flex-1 flex-col mobile:hidden">
				<div className="flex-[0.875]" />

				<div className="w-full text-center text-7xl font-extrabold leading-none tracking-tight text-white">
					Understand
				</div>

				<div className="flex-1" />
			</div>
		</main>
	)
}
