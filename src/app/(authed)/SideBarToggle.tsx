"use client"
import useSideBarOpen from "./useSideBarOpen"

export default function SideBarToggle({ children }: React.PropsWithChildren) {
	const { sideBarOpen } = useSideBarOpen()

	return (
		<div
			data-open={sideBarOpen}
			className="transition-all duration-150 data-[open=false]:mr-[-300px] data-[open=false]:translate-x-[-288px] data-[open=false]:opacity-0 mobile:mr-[-12px] mobile:data-[open=false]:mr-[-12px]"
		>
			{children}
		</div>
	)
}
