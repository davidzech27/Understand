import Link from "next/link";
import { Button as ReactAriaButton } from "react-aria-components";
import clsx from "clsx";
import colors from "colors.cjs";
import LoadingSpinner from "./LoadingSpinner";

interface Props {
	children: React.ReactNode;
	onPress?: () => void;
	disabled?: boolean;
	loading?: boolean;
	bigText?: true;
}

const FancyButton: React.FC<Props> = ({
	children,
	onPress,
	disabled,
	loading,
	bigText,
}) => {
	return (
		<ReactAriaButton
			onPress={onPress}
			isDisabled={disabled}
			className="group relative flex h-full w-full items-center justify-center"
		>
			{({ isHovered }) => (
				<>
					<span
						className={clsx(
							"z-10 font-medium",
							loading || isHovered
								? "text-white opacity-100"
								: "text-black opacity-80",
							!disabled
								? "transition-all duration-150"
								: "text-white",
							!bigText ? "text-2xl" : "text-3xl"
						)}
					>
						{loading ? <LoadingSpinner /> : children}
					</span>

					<div
						className={clsx(
							"absolute h-full w-full rounded-xl bg-gradient-to-tr from-primary to-secondary",
							!isHovered && !loading && "opacity-0",
							!disabled
								? "transition-opacity duration-150"
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
				</>
			)}
		</ReactAriaButton>
	);
};

export default FancyButton;
