"use client"
import {
	forwardRef,
	type ForwardedRef,
	type ButtonHTMLAttributes,
	type DetailedHTMLProps,
} from "react"

import LoadingSpinner from "./LoadingSpinner"
import cn from "../utils/cn"

interface Props
	extends DetailedHTMLProps<
		ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	size: "small" | "medium" | "large"
	loading?: boolean
}

function Button(
	{ children, onClick, size, loading, disabled, className, ...props }: Props,
	ref: ForwardedRef<HTMLButtonElement>
) {
	if (loading) disabled = true

	return (
		<button
			{...props}
			onClick={onClick}
			disabled={disabled}
			ref={ref}
			className={cn(
				"whitespace-pre rounded-md bg-surface-selected font-semibold tracking-[0.010em] text-black/70 outline-none transition-all duration-150",
				{
					small: "px-6 py-2.5 text-base",
					medium: "px-6 py-2.5 text-lg",
					large: "h-20 w-full text-3xl",
				}[size],
				disabled
					? "opacity-50"
					: "hover:bg-surface-selected-hover focus-visible:bg-surface-selected-hover active:bg-surface-selected-hover",
				className
			)}
		>
			{loading ? (
				<LoadingSpinner className="mx-auto h-6 w-6 fill-black opacity-90" />
			) : (
				children
			)}
		</button>
	)
}

export default forwardRef(Button)
