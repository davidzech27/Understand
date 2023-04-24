import { ToggleButton as ReactAriaToggleButton } from "react-aria-components";
import clsx from "clsx";

interface Props {
	children: React.ReactNode;
	onPress: () => void;
	toggled: boolean;
}

const ToggleButton: React.FC<Props> = ({ children, onPress, toggled }) => {
	return (
		<ReactAriaToggleButton
			onPress={onPress}
			isSelected={toggled}
			className={clsx(
				"rounded-md py-2.5 px-6 text-lg font-medium transition-all duration-150",
				toggled
					? "bg-surface-selected opacity-80 data-[hovered]:bg-surface-selected-hover"
					: "opacity-60 data-[hovered]:bg-surface-hover data-[hovered]:opacity-80"
			)}
		>
			{children}
		</ReactAriaToggleButton>
	);
};

export default ToggleButton;
