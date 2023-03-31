import Link from "next/link";
import clsx from "clsx";
import colors from "colors.cjs";

interface Props {
	children: React.ReactNode;
	onClick?: () => void;
	href?: string;
	disabled?: boolean;
	bigText?: true;
}

const FancyButton: React.FC<Props> = ({
	children,
	onClick,
	href,
	disabled,
	bigText,
}) => {
	const button = (
		<button
			onClick={onClick}
			disabled={disabled}
			className="group relative flex h-full w-full items-center justify-center"
		>
			<span
				className={clsx(
					"z-10 select-none font-medium",
					!disabled
						? "text-black opacity-80 transition-all duration-150 group-hover:text-white group-hover:opacity-100"
						: "text-white",
					!bigText ? "text-2xl" : "text-3xl"
				)}
			>
				{children}
			</span>

			<div
				className={clsx(
					"absolute h-full w-full rounded-xl bg-gradient-to-tr from-primary to-secondary",
					!disabled
						? "opacity-0 transition-opacity duration-150 group-hover:opacity-100"
						: "opacity-70"
				)}
			/>

			<div
				style={{
					border: "4px solid transparent",
					background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary}) border-box`,
					WebkitMask:
						"linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
					WebkitMaskComposite: "xor",
					maskComposite: "exclude",
				}}
				className={clsx(
					"absolute h-full w-full rounded-xl",
					disabled && "opacity-0"
				)}
			/>
		</button>
	);

	if (!href) return button;

	return <Link href={href}>{button}</Link>;
};

export default FancyButton;
