import { Suspense } from "react"
import Link from "next/link"

import SideBar from "./SideBar"
import TopActions from "./TopActions"
import colors from "~/colors.cjs"
import Card from "~/components/Card"

const AuthedLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex h-screen flex-col space-y-2.5 px-3 py-2.5">
			<nav className="flex h-8 items-center space-x-3">
				<div className="flex w-72 justify-center">
					<Link
						href="/"
						className="transition-opacity duration-150 hover:opacity-75"
					>
						<span
							style={{
								background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
								WebkitBackgroundClip: "text",
								backgroundClip: "text",
								color: "transparent",
							}}
							className="cursor-pointer text-2xl font-semibold"
						>
							Understand
						</span>
					</Link>
				</div>

				<div className="flex flex-1 justify-end">
					<TopActions />

					<div className="w-[2px]"></div>
				</div>
			</nav>

			<div className="flex h-[calc(100vh-62px)] space-x-3">
				<nav className="w-72">
					<SideBar />
				</nav>

				<main className="w-full">
					<Suspense
						fallback={<Card className="h-full w-full">{null}</Card>}
					>
						{children}
					</Suspense>
				</main>
			</div>
		</div>
	)
}

export default AuthedLayout
