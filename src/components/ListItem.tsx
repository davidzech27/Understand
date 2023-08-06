"use client"
import { forwardRef, type ForwardedRef, type HTMLProps } from "react"

import cn from "~/utils/cn"

interface Props extends HTMLProps<HTMLLIElement> {
	selected?: boolean
	disabled?: boolean
	className?: string
}

function ListItem(
	{ selected = false, disabled = false, className, ...props }: Props,
	ref: ForwardedRef<HTMLLIElement>
) {
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

export default forwardRef(ListItem)
