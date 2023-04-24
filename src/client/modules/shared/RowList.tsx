import { GridList } from "react-aria-components";
import clsx from "clsx";

interface Props<TItem> {
	items: TItem[];
	children: ({
		item,
		index,
	}: {
		item: TItem;
		index: number;
	}) => React.ReactNode;
	onSelect?: (id: string) => void;
	onAction?: (id: string) => void;
	renderEmptyState?: () => React.ReactNode;
	className?: string;
}
const RowList = <TItem extends object>({
	items,
	children,
	onSelect,
	onAction,
	renderEmptyState,
	className,
}: Props<TItem>) => {
	return (
		<GridList
			selectionMode="single"
			onSelectionChange={(selection) => {
				if (selection instanceof Set) {
					selection.forEach((s) => onSelect && onSelect(s as string)); // should only run once because selectionMode is single
				}
			}}
			onAction={(id) => onAction && onAction(id as string)}
			renderEmptyState={renderEmptyState}
			className={clsx("space-y-2.5", className)}
		>
			{items.map((item, index) => children({ item, index }))}
		</GridList>
	);
};

export default RowList;
