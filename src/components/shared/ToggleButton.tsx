import clsx from "clsx";

interface Props {
	children: React.ReactNode;
	onClick: () => void;
	toggled: boolean;
}

const ToggleButton: React.FC<Props> = ({ children, onClick, toggled }) => {
	return (
		<button
			onClick={onClick}
			className={clsx(
				"select-none rounded-md py-2.5 px-6 text-lg font-medium transition-all duration-150",
				toggled
					? "bg-surface-selected opacity-80 hover:bg-surface-selected-hover"
					: "opacity-60 hover:bg-surface-hover hover:opacity-80"
			)}
		>
			{children}
		</button>
	);
};

export default ToggleButton;
