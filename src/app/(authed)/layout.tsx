import { Suspense } from "react"
import Link from "next/link"

import SideBarToggle from "./SideBarToggle"
import SideBarLayoutContainer from "./SideBarLayoutContainer"
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
		<div className="h-screen space-y-2.5 px-3 py-2.5">
			<div className="relative flex h-8 justify-between">
				<div className="flex flex-1 justify-start">
					<SideBarToggle />
				</div>

				<div className="flex flex-1 justify-center">
					<Link
						href="/"
						className="transition-opacity duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
					>
						<GradientText asChild>
							<span className="cursor-pointer text-2xl font-extrabold tracking-tight text-white">
								Understand
							</span>
						</GradientText>
					</Link>
				</div>

				<div className="flex flex-1 justify-end">
					<TopActions />
				</div>
			</div>

			<SideBarLayoutContainer
				sideBar={<SideBar />}
				main={
					<Suspense
						fallback={<Card className="h-full w-full">{null}</Card>}
					>
						{children}
					</Suspense>
				}
				className="h-[calc(100%-32px-10px)]"
			/>
		</div>
	)
}
