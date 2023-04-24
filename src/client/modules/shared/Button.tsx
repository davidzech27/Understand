import clsx from "clsx";
import { Button as ReactAriaButton } from "react-aria-components";

interface Props {
	children: React.ReactNode;
	onPress: () => void;
	disabled?: boolean;
	fullWidth?: true;
}

const Button: React.FC<Props> = ({
	children,
	onPress,
	disabled,
	fullWidth,
}) => {
	return (
		<ReactAriaButton
			onPress={onPress}
			isDisabled={disabled}
			className={clsx(
				"rounded-md bg-surface-selected py-2.5 px-6 text-lg font-medium outline-none transition-all duration-150",
				disabled
					? "opacity-40"
					: "opacity-60 data-[hovered]:bg-surface-selected-hover data-[hovered]:opacity-80",
				fullWidth && "w-full"
			)}
		>
			{children}
		</ReactAriaButton>
	);
};

export default Button;
