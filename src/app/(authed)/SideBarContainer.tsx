"use client"
import useSideBarOpen from "./useSideBarOpen"

export default function SideBarContainer({
	children,
}: React.PropsWithChildren) {
	const { sideBarOpen } = useSideBarOpen()

	return (
		<div
			data-open={sideBarOpen}
			className="h-full w-72 transition-all duration-150 data-[open=false]:mr-[-300px] data-[open=false]:opacity-0 mobile:absolute mobile:inset-0 mobile:z-10 mobile:w-full mobile:data-[open=false]:translate-x-[-100vw]"
		>
			{children}
		</div>
	)
}
