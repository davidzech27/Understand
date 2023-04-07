import clsx from "clsx";

interface Props {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	fullWidth?: true;
}

const Button: React.FC<Props> = ({
	children,
	onClick,
	disabled,
	fullWidth,
}) => {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={clsx(
				"select-none rounded-md bg-surface-selected py-2.5 px-6 text-lg font-medium transition-all duration-150",
				disabled
					? "opacity-40"
					: "opacity-60 hover:bg-surface-selected-hover hover:opacity-80",
				fullWidth && "w-full"
			)}
		>
			{children}
		</button>
	);
};

export default Button;
