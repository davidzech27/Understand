"use client"
import { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react"

import cn from "../utils/cn"
import colors from "~/colors.cjs"
import LoadingSpinner from "./LoadingSpinner"

interface Props
	extends DetailedHTMLProps<
		ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	loading?: boolean
}

const FancyButton: React.FC<Props> = ({
	children,
	onClick,
	loading,
	disabled,
	className,
	...props
}) => {
	const buttonClassName = className
		?.split(" ")
		.filter((name) => !(name.includes("text") || name.includes("font")))
		.join(" ")

	const textClassName = className
		?.split(" ")
		.filter((name) => name.includes("text") || name.includes("font"))
		.join(" ")

	return (
		<button
			{...props}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"group relative flex h-full w-full items-center justify-center outline-none",
				buttonClassName
			)}
		>
			<>
				<span
					className={cn(
						"z-10 text-2xl font-medium transition-all duration-150",
						loading
							? "text-white opacity-100"
							: disabled
							? "text-white opacity-80"
							: "text-black opacity-80 group-focus-within:text-white group-focus-within:opacity-100 group-hover:text-white group-hover:opacity-100",

						textClassName
					)}
				>
					{loading ? <LoadingSpinner /> : children}
				</span>

				<div
					className={cn(
						"absolute h-full w-full rounded-xl bg-gradient-to-tr from-primary to-secondary transition-all duration-150",
						!loading &&
							!disabled &&
							"opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
						disabled && "opacity-70"
					)}
				/>

				<div
					style={{
						border: "4px solid transparent",
						background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary}) border-box`,
						WebkitMask:
							"linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
						WebkitMaskComposite: "xor",
						maskComposite: "exclude",
					}}
					className={cn(
						"absolute h-full w-full rounded-xl transition-all duration-150",
						disabled && "opacity-0"
					)}
				/>
			</>
		</button>
	)
}

export default FancyButton
