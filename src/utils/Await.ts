"use client"
import { use } from "react"

interface Props<TPromise> {
	promise: Promise<TPromise>
	children: (resolved: TPromise) => React.ReactNode
}

const Await = <TPromise>({ promise, children }: Props<TPromise>) => {
	const resolved = use(promise)

	return children(resolved)
}

export default Await
