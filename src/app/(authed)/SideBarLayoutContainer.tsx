"use client"
import cn from "~/utils/cn"
import useSideBarOpen from "./useSideBarOpen"

interface Props {
	sideBar: React.ReactNode
	main: React.ReactNode
	className?: string
}

export default function SideBarLayoutContainer({
	sideBar,
	main,
	className,
}: Props) {
	const { sideBarOpen } = useSideBarOpen()

	return (
		<div
			data-open={sideBarOpen}
			className={cn(
				"group relative flex space-x-3 mobile:space-x-0",
				className,
			)}
		>
			<div className="h-full w-72 shrink-0 transition-all duration-150 group-data-[open=false]:mr-[-300px] group-data-[open=false]:opacity-0 mobile:absolute mobile:inset-0 mobile:z-10 mobile:w-auto mobile:group-data-[open=false]:mr-0 mobile:group-data-[open=false]:translate-x-[-100vw]">
				{sideBar}
			</div>

			<main className="w-[calc(100%-288px-12px)] transition-all duration-150 group-data-[open=false]:w-full mobile:w-auto">
				{main}
			</main>
		</div>
	)
}
