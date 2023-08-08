"use client"
import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"

import env from "env.mjs"
import { SignedInProvider, setSignedIn } from "~/utils/useSignedIn"

interface Props extends React.PropsWithChildren {
	signedIn: boolean
}

if (typeof window !== "undefined") {
	posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
		api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
		loaded: (posthog) => {
			if (env.NEXT_PUBLIC_URL.includes("localhost")) posthog.debug()
		},
	})
}

export default function Providers({ signedIn, children }: Props) {
	const pathname = usePathname()
	const searchParams = useSearchParams()

	useEffect(() => {
		if (pathname && searchParams) {
			let url = window.origin + pathname

			if (searchParams.toString()) {
				url = url + `?${searchParams.toString()}`
			}
			posthog.capture("$pageview", {
				$current_url: url,
			})
		}
	}, [pathname, searchParams])

	return (
		<PostHogProvider client={posthog}>
			<SignedInProvider value={{ signedIn, setSignedIn }}>
				{children}
			</SignedInProvider>
		</PostHogProvider>
	)
}
