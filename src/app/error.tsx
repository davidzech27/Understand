"use client"

export default function Error({ error }: { error: Error }) {
	// TODO - potentially implement better error logging
	console.error("Error: ", error)

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
