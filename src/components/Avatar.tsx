"use client"

import cn from "../utils/cn"

interface Props {
	src: string | undefined
	name: string | undefined
	fallbackColor: "primary" | "secondary"
	border?: true
	className: string
}

const Avatar: React.FC<Props> = ({
	src,
	name,
	fallbackColor,
	border,
	className,
}) => {
	const fallback = name?.[0] ? (
		<div
			ref={(div) => {
				div &&
					(div.style.fontSize = `${
						div.offsetHeight * 0.51555555555
					}px`)
			}}
			className={cn(
				"flex h-full w-full items-center justify-center rounded-full text-white",
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

	return src ? (
		<img
			src={src}
			alt={name ?? "No title"}
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

export default Avatar
