import { type HTMLProps } from "react"

import cn from "~/utils/cn"

interface Props<TItem> extends HTMLProps<HTMLUListElement> {
	items: TItem[]
	renderItem: (item: TItem, index: number) => React.ReactNode
	renderEmpty: () => React.ReactNode
}

export default function UnorderedList<TItem>({
	items,
	renderItem,
	renderEmpty,
	className,
	...props
}: Props<TItem>) {
	return items.length === 0 ? (
		<>{renderEmpty() ?? null}</>
	) : (
		<ul {...props} className={cn("space-y-2.5", className)}>
			{items.map(renderItem)}
		</ul>
	)
}
