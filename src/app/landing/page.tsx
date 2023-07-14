import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { Suspense } from "react"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"
import LandingForm from "./LandingForm"
import GradientText from "~/components/GradientText"

export const runtime = "edge"

export const metadata = {
	title: "Landing",
}

// perhaps add extra content to fill awkward whitespace
export default async function LandingPage() {
	const profilePromise = getAuthOrThrow({ cookies: cookies() })
		.then(({ email }) => User({ email }).get())
		.then((profile) => profile ?? notFound())

	return (
		<>
			<main className="flex h-screen w-full justify-center bg-gradient-to-tr from-primary to-secondary">
				<div className="hidden flex-[0.625] flex-col justify-center py-5 pl-6 md:flex">
					<div className="flex-[0.875]" />

					<h1 className="w-full text-center text-7xl font-bold leading-[1.05] tracking-tight text-white">
						One more question before you get started.
					</h1>

					<div className="flex-1" />
				</div>

				<div className="flex-1 py-5 px-6">
					<div className="flex h-full flex-col items-center rounded-lg bg-white px-[16%] shadow-xl">
						<div className="flex-[0.875]">
							<GradientText asChild>
								<span className="mt-[24%] flex text-5xl font-bold md:hidden">
									Understand
								</span>
							</GradientText>
						</div>

						<LandingForm profilePromise={profilePromise} />

						<div className="flex-1" />
					</div>
				</div>
			</main>
		</>
	)
}
