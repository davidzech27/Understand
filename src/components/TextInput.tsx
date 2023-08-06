"use client"
import { forwardRef, type ForwardedRef, type HTMLProps } from "react"

import cn from "../utils/cn"

interface Props extends HTMLProps<HTMLInputElement> {
	value: string
	setValue: (value: string) => void
}

function TextInput(
	{ value, setValue, className, ...props }: Props,
	ref: ForwardedRef<HTMLInputElement>
) {
	return (
		<input
			{...props}
			type="text"
			value={value}
			onChange={(e) => setValue(e.target.value)}
			ref={ref}
			className={cn(
				"w-full cursor-pointer select-text resize-none rounded-md border-[1px] border-border bg-surface px-4 py-2.5 font-medium opacity-80 outline-none transition-all duration-150 focus:cursor-auto focus:bg-surface-bright",
				className
			)}
		/>
	)
}

export default forwardRef(TextInput)
