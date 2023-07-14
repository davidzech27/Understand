"use client"
import { Slot } from "@radix-ui/react-slot"

import colors from "colors.cjs"

interface Props extends React.PropsWithChildren {
	asChild?: boolean
	className?: string
}

export default function GradientText({ asChild, children, className }: Props) {
	const Component = asChild ? Slot : "div"

	return (
		<Component
			style={{
				background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
				WebkitBackgroundClip: "text",
				backgroundClip: "text",
				color: "transparent",
				userSelect: "none",
			}}
			className={className}
		>
			{children}
		</Component>
	)
}