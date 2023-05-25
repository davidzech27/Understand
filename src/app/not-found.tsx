import * as Sentry from "@sentry/nextjs"

import { env } from "~/env.mjs"

export const metadata = {
	title: "Link not found | Understand",
	description:
		"The personalized educational content and student insight platform",
}

const NotFoundPage = () => {
	if (env.NODE_ENV === "production")
		Sentry.captureEvent({ message: "Link not found" })

	return (
		<div className="flex h-screen w-full flex-col items-center bg-gradient-to-tr from-primary to-secondary">
			<div className="flex-[0.875]" />

			<span className="cursor-default px-48 text-[5rem] font-semibold leading-none text-white">
				This link does not exist. If you think it should, please contact
				us.
			</span>

			<div className="flex-1" />
		</div>
	)
}

export default NotFoundPage
