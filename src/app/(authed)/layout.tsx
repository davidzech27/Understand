import { Suspense } from "react"
import Link from "next/link"

import ToggleSideBar from "./ToggleSideBar"
import SideBar from "./SideBar"
import TopActions from "./TopActions"
import Card from "~/components/Card"
import GradientText from "~/components/GradientText"

export default function AuthedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex h-screen flex-col space-y-2.5 px-3 py-2.5">
			<div className="relative flex justify-center">
				<div className="absolute left-0 top-0 bottom-0">
					<ToggleSideBar />
				</div>

				<div className="flex">
					<Link
						href="/"
						className="transition-opacity duration-150 hover:opacity-75"
					>
						<GradientText asChild>
							<span className="relative top-[2px] cursor-pointer text-2xl font-extrabold leading-none tracking-tight text-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75">
								Understand
							</span>
						</GradientText>
					</Link>
				</div>

				<div className="absolute top-0 bottom-0 right-0">
					<TopActions />
				</div>
			</div>

			<div className="relative flex flex-1 space-x-3">
				<SideBar />

				<main className="h-[calc(100vh-56px)] flex-1">
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
