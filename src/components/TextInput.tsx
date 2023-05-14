"use client"
import {
	forwardRef,
	type DetailedHTMLProps,
	type InputHTMLAttributes,
} from "react"

import cn from "../utils/cn"

interface Props
	extends DetailedHTMLProps<
		InputHTMLAttributes<HTMLInputElement>,
		HTMLInputElement
	> {
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
					"h-full w-full cursor-pointer select-text resize-none rounded-md border-[1px] border-border bg-surface py-1.5 px-3 text-xl font-medium opacity-80 outline-none transition-all duration-150 focus:cursor-auto focus:bg-surface-bright",
					className
				)}
			/>
		)
	}
)

TextInput.displayName = "TextArea"

export default TextInput
