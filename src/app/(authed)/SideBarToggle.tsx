"use client"
import { Menu } from "lucide-react"

import useSideBarOpen from "./useSideBarOpen"

export default function SideBarToggle() {
	const { toggleSideBarOpen } = useSideBarOpen()

	return (
		<div
			onClick={toggleSideBarOpen}
			className="flex cursor-pointer items-center rounded-md p-1 transition duration-150 hover:bg-background-raised-hover"
		>
			<Menu size={24} className="text-black opacity-70" />
		</div>
	)
}
