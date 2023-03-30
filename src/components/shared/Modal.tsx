interface Props {
	children: React.ReactNode;
	title: string;
	onClose: () => void;
}

const Modal: React.FC<Props> = ({ children, title, onClose }) => {
	return (
		<div
			onClick={onClose}
			className="fixed top-0 z-50 flex h-screen w-screen items-center justify-center bg-[#00000060]"
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="flex h-3/5 w-2/3 flex-col rounded-md bg-white"
			>
				<div className="flex items-center justify-between pt-2 pr-3">
					<span className="mb-0.5 pt-[5px] pl-5 text-lg font-medium opacity-60">
						{title}
					</span>

					<div
						onClick={onClose}
						className="cursor-pointer rounded-lg p-1 transition-all duration-150 hover:bg-surface-hover"
					>
						<X />
					</div>
				</div>

				<div className="h-full px-4 pt-1 pb-3">{children}</div>
			</div>
		</div>
	);
};

export default Modal;

const X: React.FC = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="32"
		height="32"
		viewBox="0 0 32 32"
		fill="none"
		stroke="black"
		strokeWidth="2.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="24" y1="8" x2="8" y2="24"></line>
		<line x1="8" y1="8" x2="24" y2="24"></line>
	</svg>
);
