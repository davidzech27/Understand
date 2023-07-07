"use client"
import { forwardRef, type HTMLProps } from "react"

import cn from "~/utils/cn"

interface Props extends HTMLProps<HTMLLIElement> {
	selected?: boolean
	disabled?: boolean
	className?: string
}

const ListItem = forwardRef<HTMLLIElement, Props>(
	({ selected = false, disabled = false, className, ...props }, ref) => {
		return (
			<li
				{...props}
				ref={ref}
				className={cn(
					"rounded-md border-[0.75px] border-border px-6 transition-all duration-150",
					disabled
						? "outline-none"
						: cn(
								"cursor-pointer focus-visible:outline-border",
								selected
									? "bg-surface-selected hover:bg-surface-selected-hover"
									: "bg-surface hover:bg-surface-hover"
						  ),
					className
				)}
			/>
		)
	}
)

ListItem.displayName = "ListItem"

export default ListItem
