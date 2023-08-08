"use client"
import { useState } from "react"

import cn from "../utils/cn"

interface Props {
	src: string | undefined
	name: string | undefined
	fallbackColor: "primary" | "secondary"
	border?: true
	className: string
}

export default function Avatar({
	src,
	name,
	fallbackColor,
	border,
	className,
}: Props) {
	const [isError, setIsError] = useState(false)

	const fallback = name?.[0] ? (
		<div
			ref={(div) => {
				div &&
					(div.style.fontSize = `${
						div.offsetHeight * 0.51555555555
					}px`)
			}}
			className={cn(
				"flex h-full w-full items-center justify-center rounded-full font-semibold text-white",
				fallbackColor === "primary" ? "bg-primary" : "bg-secondary"
			)}
		>
			{name[0].toUpperCase()}
		</div>
	) : (
		<div
			className={cn(
				"h-full w-full rounded-full bg-white",
				border && "border-[0.75px] border-border"
			)}
		/>
	)

	return src && !isError ? (
		<img
			src={`${src}?no-cache`}
			alt={name ?? "No title"}
			onError={() => setIsError(true)}
			crossOrigin="anonymous" // not effective
			className={cn(
				"h-full w-full rounded-full",
				border && "border-[0.75px] border-border",
				className
			)}
		/>
	) : (
		<div className={className}>{fallback}</div>
	)
}
