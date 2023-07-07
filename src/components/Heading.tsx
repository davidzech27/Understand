import cn from "~/utils/cn"

interface Props extends React.PropsWithChildren {
	size: "small" | "medium" | "large"
	className?: string
}

const Heading: React.FC<Props> = ({ size = "medium", className, children }) => {
	return (
		<div
			className={cn(
				{
					small: "text-sm font-medium opacity-60",
					medium: "text-base font-medium opacity-80",
					large: "text-lg font-medium opacity-60",
				}[size],
				className
			)}
		>
			{children}
		</div>
	)
}

export default Heading
