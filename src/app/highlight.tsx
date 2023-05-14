"use client"
import { H } from "highlight.run"
import { ErrorBoundary } from "@highlight-run/react"

import { env } from "~/env.mjs"

const localhost =
	typeof window !== "undefined" && window.location.href.includes("localhost")

if (!localhost) {
	H.init(env.NEXT_PUBLIC_HIGHLIGHT_PRODUCT_ID, {
		tracingOrigins: true,
		networkRecording: {
			enabled: true,
			recordHeadersAndBody: true,
		},
		enableStrictPrivacy: false,
	})
}

const ErrorBoundaryCasted = ErrorBoundary as unknown as ({}: {
	children: React.ReactNode
	customDialog: React.ReactNode
}) => React.ReactNode

export const HighlightErrorBoundary = ({
	children,
}: {
	children: React.ReactNode
}) => (
	<ErrorBoundaryCasted
		customDialog={
			<main className="h-screen w-screen select-text bg-black p-[20vw] text-5xl font-medium text-white">
				There has been an error! We&apos;ll probably fix this soon. In
				the meantime, try refreshing the page, or perhaps signing in
				again.
			</main>
		}
	>
		{children}
	</ErrorBoundaryCasted>
)
