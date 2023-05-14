"use client"
import * as Toggle from "@radix-ui/react-toggle"

import cn from "../utils/cn"

interface Props extends Toggle.ToggleProps {
	onToggle: () => void
	toggled: boolean
}

const ToggleButton: React.FC<Props> = ({
	children,
	onToggle,
	toggled,
	className,
	...props
}) => {
	return (
		<Toggle.Root
			{...props}
			onPressedChange={onToggle}
			pressed={toggled}
			className={cn(
				"rounded-md py-2.5 px-6 text-lg font-medium transition-all duration-150",
				toggled
					? "bg-surface-selected opacity-80 focus-within:bg-surface-selected-hover hover:bg-surface-selected-hover"
					: "opacity-60 focus-within:bg-surface-hover focus-within:opacity-80 hover:bg-surface-hover hover:opacity-80",
				className
			)}
		>
			{children}
		</Toggle.Root>
	)
}

export default ToggleButton
