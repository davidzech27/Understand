import { Slot } from "@radix-ui/react-slot"

import UnorderedList from "./UnorderedList"

interface Props<TItem extends { id: string }> {
	items: TItem[]
	renderItem: ({
		index,
		selected,
		item,
	}: {
		item: TItem
		selected: boolean
		index: number
	}) => React.ReactNode
	renderEmpty: () => React.ReactNode
	selectionType: "multiple" | "single" | "none"
	selectionSet: Set<string>
	setSelectionSet: (
		value: Set<string> | ((prevSelectionSet: Set<string>) => Set<string>)
	) => void
	className?: string
}

export default function SelectList<TItem extends { id: string }>({
	items,
	renderItem,
	renderEmpty,
	selectionType,
	selectionSet,
	setSelectionSet,
	className,
}: Props<TItem>) {
	const onAction = (itemId: string) => {
		if (selectionType !== "none") {
			setSelectionSet((selectionSet) => {
				if (selectionSet.has(itemId)) {
					return new Set(
						selectionType === "multiple"
							? [...selectionSet].filter((id) => id !== itemId)
							: []
					)
				} else {
					return new Set([
						...(selectionType === "multiple" ? selectionSet : []),
						itemId,
					])
				}
			})
		}
	}

	return (
		<UnorderedList
			items={items}
			renderItem={(item, index) => (
				<Slot
					onClick={() => onAction(item.id)}
					onKeyDown={(e) => {
						if ((e.key === "Enter" || e.key === " ") && onAction) {
							onAction(item.id)
						}
					}}
					onFocus={(e) => {
						if (
							(e.relatedTarget === null ||
								e.relatedTarget.tagName === "BODY") &&
							selectionType === "single"
						) {
							setSelectionSet(new Set([item.id]))
						}
					}}
					key={item.id}
				>
					{renderItem({
						item,
						selected: selectionSet.has(item.id),
						index,
					})}
				</Slot>
			)}
			renderEmpty={renderEmpty}
			className={className}
		/>
	)
}
