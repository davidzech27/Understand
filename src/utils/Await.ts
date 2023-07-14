import { use } from "react"

interface Props<TPromise> {
	promise: Promise<TPromise>
	children: (resolved: TPromise) => React.ReactNode
}

export default function Await<TPromise>({
	promise,
	children,
}: Props<TPromise>) {
	const resolved = use(promise)

	return children(resolved)
}
