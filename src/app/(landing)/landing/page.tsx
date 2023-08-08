import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"
import colors from "colors.cjs"
import LandingForm from "./LandingForm"

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

				<div className="flex h-full w-full flex-col rounded-lg border-[0.5px] border-border bg-white p-6 shadow-xl shadow-[#00000016]">
					<div className="flex-[0.875] mobile:hidden" />

					<LandingForm
						profilePromise={profilePromise}
						className="flex flex-1 flex-col space-y-12 mobile:justify-between mobile:space-y-0 mobile:pt-10"
					/>

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
