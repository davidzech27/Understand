import Link from "next/link"

import env from "~/env.mjs"

export const runtime = "edge"

export const metadata = {
	title: "Link not found | Understand",
}

export default function NotFoundPage() {
	if (env.NODE_ENV === "production") {
		// TODO - log not found
	}

	return (
		<div className="flex h-screen w-full flex-col items-center bg-gradient-to-tr from-primary to-secondary">
			<div className="flex-[0.875]" />

			<div className="flex cursor-default select-text flex-col items-center justify-center gap-12 whitespace-pre-wrap px-48 text-[5rem] font-extrabold tracking-tight text-white">
				This link does not exist. If you think it should, please contact
				us.
				{"\n"}
				<Link
					href="/home"
					className="block transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
				>
					Go home
				</Link>
			</div>

			<div className="flex-1" />
		</div>
	)
}
