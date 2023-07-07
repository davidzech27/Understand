"use client"
import { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react"

import LoadingSpinner from "./LoadingSpinner"
import cn from "../utils/cn"

interface Props
	extends DetailedHTMLProps<
		ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	size?: "small" | "medium" | "large"
	loading?: boolean
}

const Button: React.FC<Props> = ({
	children,
	onClick,
	size = "medium",
	loading,
	disabled,
	className,
	...props
}) => {
	if (loading) disabled = true

	return (
		<div
			className={cn(
				"relative",
				size === "large" && "h-20",
				className
					?.split(" ")
					.filter(
						(name) => name.startsWith("h-") || name.startsWith("w-")
					)
					.join(" ") ?? ""
			)}
		>
			<button
				{...props}
				onClick={onClick}
				disabled={disabled}
				className={cn(
					"rounded-md bg-surface-selected px-6 py-2.5 font-medium outline-none transition-all duration-150",
					{
						small: "text-base", // maybe add height for consistency
						medium: "text-lg",
						large: "text-3xl",
					}[size],
					disabled
						? "opacity-40"
						: "opacity-60 hover:bg-surface-selected-hover hover:opacity-80 focus-visible:bg-surface-selected-hover focus-visible:opacity-80",
					"h-full w-full",
					className
						?.split(" ")
						.filter(
							(name) =>
								!name.startsWith("h-") && !name.startsWith("w-")
						)
						.join(" ") ?? ""
				)}
			>
				{loading ? (
					<LoadingSpinner className="mx-auto h-6 w-6 fill-black opacity-90" />
				) : (
					children
				)}
			</button>

			<div className="absolute bottom-0 left-0 right-0 top-0 -z-10 rounded-md bg-white" />
		</div>
	)
}

export default Button
