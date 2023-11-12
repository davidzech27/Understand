import { forwardRef, type ForwardedRef } from "react"
import { Slot } from "@radix-ui/react-slot"

import cn from "~/utils/cn"

interface Props extends React.PropsWithChildren {
	size: "small" | "medium" | "large" | "xLarge" | "2xLarge"
	asChild?: boolean
	className?: string
}

function Heading(
	{ size = "medium", asChild, className, children }: Props,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const Component = asChild ? Slot : "div"

	return (
		<Component
			ref={ref}
			className={cn(
				"font-semibold leading-none text-black/70",
				{
					small: "text-sm",
					medium: "text-base",
					large: "text-lg",
					xLarge: "text-xl",
					"2xLarge": "text-2xl",
				}[size],
				className,
			)}
		>
			{children}
		</Component>
	)
}

export default forwardRef(Heading)
