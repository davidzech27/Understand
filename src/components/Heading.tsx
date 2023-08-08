import { forwardRef, type ForwardedRef } from "react"
import { Slot } from "@radix-ui/react-slot"

import cn from "~/utils/cn"

interface Props extends React.PropsWithChildren {
	size: "small" | "medium" | "large"
	asChild?: boolean
	className?: string
}

function Heading(
	{ size = "medium", asChild, className, children }: Props,
	ref: ForwardedRef<HTMLDivElement>
) {
	const Component = asChild ? Slot : "div"

	return (
		<Component
			ref={ref}
			className={cn(
				{
					small: "text-sm font-semibold opacity-70",
					medium: "text-base font-semibold opacity-70",
					large: "text-lg font-semibold opacity-70",
				}[size],
				className
			)}
		>
			{children}
		</Component>
	)
}

export default forwardRef(Heading)
