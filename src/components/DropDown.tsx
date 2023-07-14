import * as Select from "@radix-ui/react-select"
import { ChevronDown } from "lucide-react"

import Heading from "./Heading"

interface Props<TItem> {
	value?: string
	setValue: (value: string) => void
	displayValue: string
	items: TItem[]
	getItemValue: (item: TItem) => string
	renderItem: (item: TItem) => React.ReactNode
	id?: string
	name?: string
}

export function Root<TItem>({
	value,
	setValue,
	displayValue,
	items,
	getItemValue,
	renderItem,
	id,
	name,
}: Props<TItem>) {
	return (
		<Select.Root name={name} value={value} onValueChange={setValue}>
			<Select.Trigger
				id={id}
				className="flex w-full cursor-pointer justify-between rounded-md border-[0.75px] border-border px-4 py-2.5 outline-none transition-all duration-150 data-[state=open]:bg-white"
			>
				<Select.Value asChild>
					<Heading size="medium">{displayValue}</Heading>
				</Select.Value>

				<Select.Icon asChild>
					<ChevronDown
						size={24}
						className="relative top-[2px] text-black opacity-80"
					/>
				</Select.Icon>
			</Select.Trigger>

			<Select.Portal>
				<Select.Content position="popper" sideOffset={4}>
					<Select.Viewport className="w-full rounded-md border-[0.75px] border-border bg-white">
						{items.map((item) => (
							<Select.Item
								value={getItemValue(item)}
								key={getItemValue(item)}
								className="cursor-pointer border-t-[0.75px] border-border bg-surface opacity-80 outline-none transition-all duration-150 hover:bg-surface-hover data-[state=checked]:bg-surface-selected data-[state=checked]:hover:bg-surface-selected-hover"
							>
								{renderItem(item)}
							</Select.Item>
						))}
					</Select.Viewport>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	)
}

export const ItemText = Select.ItemText
