"use client"
import { forwardRef, type ForwardedRef } from "react"
import ExpandingTextArea, { type TextareaProps } from "react-expanding-textarea"

import cn from "../utils/cn"

interface Props extends TextareaProps {
	value: string
	setValue: (value: string) => void
	onEnter?: () => void
}

function TextArea(
	{ value, setValue, onEnter, className, ...props }: Props,
	ref: ForwardedRef<HTMLTextAreaElement>,
) {
	return (
		<ExpandingTextArea
			{...props}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			onKeyDown={(e) => {
				if (onEnter !== undefined && e.key === "Enter" && !e.shiftKey) {
					e.preventDefault()

					onEnter()
				}
			}}
			ref={ref}
			className={cn(
				"-mb-1.5 h-full w-full cursor-pointer select-text resize-none rounded-md border-[1px] border-border bg-surface px-4 py-2.5 font-medium opacity-80 outline-none transition-colors duration-150 focus:cursor-auto focus:bg-surface-bright",
				className,
			)}
		/>
	)
}

export default forwardRef(TextArea)
