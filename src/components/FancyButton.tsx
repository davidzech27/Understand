"use client"
import {
	forwardRef,
	type ForwardedRef,
	type ButtonHTMLAttributes,
	type DetailedHTMLProps,
} from "react"

import cn from "../utils/cn"
import colors from "colors.cjs"
import LoadingSpinner from "./LoadingSpinner"

interface Props
	extends DetailedHTMLProps<
		ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	size: "small" | "medium" | "large"
	loading?: boolean
}

function FancyButton(
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
			style={{
				background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary} 100%)`,
			}}
			className={cn(
				"whitespace-pre font-semibold tracking-[0.010em] text-white outline-none transition-all duration-150 hover:opacity-80 focus-visible:opacity-80 active:opacity-80",
				{
					small: "rounded-[10px] px-8 py-2.5 text-lg",
					medium: "rounded-xl px-12 py-4 text-2xl",
					large: "h-20 w-full rounded-xl text-3xl",
				}[size],
				disabled && !loading && "opacity-50",
				className
			)}
		>
			{loading ? <LoadingSpinner /> : children}
		</button>
	)
}

export default forwardRef(FancyButton)
