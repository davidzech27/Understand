import {
	Modal as ReactAriaModal,
	ModalOverlay,
	Dialog,
	Heading,
} from "react-aria-components";

interface Props {
	children: React.ReactNode;
	title: string;
	open: boolean;
	setOpen: (open: boolean) => void;
	footer?: React.ReactNode;
}

const Modal: React.FC<Props> = ({ children, title, open, setOpen, footer }) => {
	return (
		<ModalOverlay
			isDismissable
			isOpen={open}
			onOpenChange={setOpen}
			className="fixed top-0 z-50 flex h-screen w-screen items-center justify-center bg-[#00000060]"
		>
			<ReactAriaModal
				isDismissable
				isOpen={open}
				onOpenChange={setOpen}
				className="flex h-3/5 w-2/3 flex-col rounded-md bg-white"
			>
				<Dialog className="flex h-full flex-col justify-between">
					<div className="mx-6 mt-6 flex items-center justify-between">
						<Heading className="mb-0.5 text-2xl font-medium leading-none opacity-80">
							{title}
						</Heading>

						<div
							onClick={() => setOpen(false)}
							className="relative bottom-[1px] -m-2 cursor-pointer rounded-lg p-1 transition-all duration-150 hover:bg-surface-hover"
						>
							<X />
						</div>
					</div>
					<div className="m-6 h-full">{children}</div>
					{footer}{" "}
				</Dialog>
			</ReactAriaModal>
		</ModalOverlay>
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
