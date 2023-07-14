"use client"
import { forwardRef, type HTMLProps } from "react"

import cn from "../utils/cn"

interface Props extends HTMLProps<HTMLInputElement> {
	value: string
	setValue: (value: string) => void
}

const TextInput = forwardRef<HTMLInputElement, Props>(
	({ value, setValue, className, ...props }, ref) => {
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
)

TextInput.displayName = "TextInput"

export default TextInput
