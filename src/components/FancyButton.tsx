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
	ref: ForwardedRef<HTMLButtonElement>,
) {
	return (
		<button
			{...props}
			onClick={onClick}
			disabled={disabled || loading}
			ref={ref}
			style={{
				background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary} 100%)`,
			}}
			className={cn(
				"flex items-center justify-center whitespace-pre font-semibold tracking-[0.010em] text-white outline-none transition-all duration-150 hover:opacity-80 focus-visible:opacity-80 active:opacity-80",
				{
					small: "rounded-[10px] px-8 py-2.5 text-lg",
					medium: "rounded-xl px-12 py-4 text-2xl",
					large: "h-20 w-full rounded-xl text-3xl",
				}[size],
				disabled &&
					"opacity-50 hover:opacity-50 focus-visible:opacity-50 active:opacity-50",
				loading &&
					"hover:opacity-100 focus-visible:opacity-100 active:opacity-100",
				className,
			)}
		>
			{loading ? <LoadingSpinner /> : children}
		</button>
	)
}

export default forwardRef(FancyButton)
