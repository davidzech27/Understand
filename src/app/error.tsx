"use client"
import { useEffect, useRef } from "react"

export default function Error({ error }: { error: Error }) {
	const logged = useRef(false)

	useEffect(() => {
		if (!logged.current) {
			logged.current = true

			console.error(error)
		}
	}, [error])

	return (
		<main className="flex h-screen w-screen flex-col bg-black">
			<div className="flex-[0.875]" />

			<div className="mx-[20vw] select-text text-5xl font-medium leading-relaxed text-white">
				There has been an error! We&apos;ll probably fix this soon. In
				the meantime, try refreshing the page, or perhaps signing in
				again.
			</div>

			<div className="flex-1" />
		</main>
	)
}
