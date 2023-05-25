"use client"
import cn from "../utils/cn"

interface ListProps<TItem> {
	items: TItem[]
	children: ({
		item,
		index,
	}: {
		item: TItem
		index: number
	}) => React.ReactNode
	renderEmptyState?: React.ReactNode
	className?: string
}

interface ItemProps {
	children: React.ReactNode
	onAction?: () => void
	onKeyboardFocus?: () => void
	selected?: boolean
	disabled?: boolean
}

const Row = {
	List: <TItem,>({
		items,
		children,
		renderEmptyState,
		className,
	}: ListProps<TItem>) => {
		return items.length === 0 ? (
			renderEmptyState
		) : (
			<ul className={cn("space-y-2.5", className)}>
				{items.map((item, index) => children({ item, index }))}
			</ul>
		)
	},
	Item: ({
		children,
		onAction,
		onKeyboardFocus,
		selected,
		disabled,
	}: ItemProps) => {
		return (
			<li
				onClick={onAction}
				onKeyDown={(e) => {
					if ((e.key === "Enter" || e.key === " ") && onAction) {
						onAction()
					}
				}}
				// not working in modal
				onFocus={(e) => {
					if (
						e.relatedTarget === null ||
						e.relatedTarget.tagName === "BODY"
					) {
						onKeyboardFocus && onKeyboardFocus()
					}
				}}
				className={cn(
					"h-full w-full rounded-md border-[0.75px] border-border pl-6 pr-8 outline-none transition-all duration-150",
					!disabled &&
						cn(
							"focus-visible:outline-border",
							selected
								? "bg-surface-selected hover:bg-surface-selected-hover"
								: "bg-surface hover:bg-surface-hover"
						)
				)}
			>
				{children}
			</li>
		)
	},
}

export default Row
