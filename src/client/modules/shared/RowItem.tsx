import { Item } from "react-aria-components";
import clsx from "clsx";

interface Props {
	id: string;
	children: React.ReactNode;
	disabled?: boolean;
}

const RowItem: React.FC<Props> = ({ id, children, disabled }) => {
	return (
		<Item
			key={id}
			id={id}
			className={clsx(
				"rounded-md border-[0.75px] border-border pl-6 pr-8 outline-border transition-colors duration-150",
				!disabled &&
					"data-[hovered]:bg-surface-hover data-[focus-visible]:bg-surface-hover"
			)}
		>
			{children}
		</Item>
	);
};

export default RowItem;
