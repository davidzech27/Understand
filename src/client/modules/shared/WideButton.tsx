import clsx from "clsx";

interface Props {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}

const WideButton: React.FC<Props> = ({ children, onClick, disabled }) => {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={clsx(
				"h-full w-full select-none rounded-md bg-surface-selected py-2.5 px-6 text-2xl font-medium transition-all duration-150",
				disabled
					? "opacity-40"
					: "opacity-60 hover:bg-surface-selected-hover hover:opacity-80"
			)}
		>
			{children}
		</button>
	);
};

export default WideButton;
