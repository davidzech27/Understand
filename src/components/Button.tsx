"use client"
import { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react"

import LoadingSpinner from "./LoadingSpinner"
import cn from "../utils/cn"

interface Props
	extends DetailedHTMLProps<
		ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	loading?: boolean
}

const Button: React.FC<Props> = ({
	children,
	onClick,
	loading,
	disabled,
	className,
	...props
}) => {
	return (
		<button
			{...props}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"rounded-md bg-surface-selected py-2.5 px-6 text-2xl font-medium outline-none transition-all duration-150",
				disabled
					? "opacity-40"
					: "opacity-60 hover:bg-surface-selected-hover hover:opacity-80 focus-visible:bg-surface-selected-hover focus-visible:opacity-80",
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

export default Button
