"use client"
import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

interface Props {
	children: React.ReactNode
}

const ErrorBoundaryCasted = Sentry.ErrorBoundary as unknown as ({}: {
	children: React.ReactNode
	fallback: React.ReactNode
}) => React.ReactNode

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
	return (
		<ErrorBoundaryCasted
			fallback={
				<main className="h-screen w-screen select-text bg-black p-[20vw] text-5xl font-medium text-white">
					There has been an error! We&apos;ll probably fix this soon.
					In the meantime, try refreshing the page, or perhaps signing
					in again.
				</main>
			}
		>
			{children}
		</ErrorBoundaryCasted>
	)
}

export const NotFound: React.FC = () => {
	useEffect(() => {
		Sentry.captureEvent({ message: "Link not found" })
	}, [])

	return null
}
