import { forwardRef } from "react"
import { Slot } from "@radix-ui/react-slot"

import cn from "~/utils/cn"

interface Props extends React.PropsWithChildren {
	size: "small" | "medium" | "large"
	asChild?: boolean
	className?: string
}

const Heading = forwardRef<HTMLDivElement, Props>(
	({ size = "medium", asChild, className, children }, ref) => {
		const Component = asChild ? Slot : "div"

		return (
			<Component
				ref={ref}
				className={cn(
					{
						small: "text-sm font-medium opacity-60",
						medium: "text-base font-medium opacity-80",
						large: "text-lg font-medium opacity-60",
					}[size],
					className
				)}
			>
				{children}
			</Component>
		)
	}
)

Heading.displayName = "Heading"

export default Heading
