import Link from "next/link"

import getAuthenticationURL from "~/google/getAuthenticationURL"
import FancyButton from "~/components/FancyButton"
import GradientText from "~/components/GradientText"

export const metadata = {
	title: "Sign in",
}

export const runtime = "edge"

// todo - add extra content to fill awkward whitespace. or perhaps make panel smaller, but this would make the gradient section too big

export default function SignInPage() {
	return (
		<>
			<main className="flex h-screen w-full justify-center bg-gradient-to-tr from-primary to-secondary">
				<div className="hidden flex-[0.625] flex-col justify-center py-5 pl-6 md:flex">
					<div className="flex-[0.875]" />

					<h1 className="w-full text-center text-7xl font-bold leading-[1.05] tracking-tight text-white">
						Welcome to Understand!
						<br />
						Let&apos;s get started.
					</h1>

					<div className="flex-1" />
				</div>

				<div className="flex-1 py-5 px-6">
					<div className="flex h-full w-full flex-col items-center rounded-lg bg-white px-[16%] shadow-xl">
						<div className="flex flex-[0.875]">
							<GradientText asChild>
								<span className="mt-[24%] flex text-5xl font-bold md:hidden">
									Understand
								</span>
							</GradientText>
						</div>

						<div className="flex flex-col justify-between">
							<h1 className="mb-8 text-center text-3xl font-medium opacity-80">
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
								legacyBehavior
							>
								<FancyButton size="large">Sign in</FancyButton>
							</Link>
						</div>

						<div className="flex-1" />
					</div>
				</div>
			</main>
		</>
	)
}
