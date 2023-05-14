import cn from "../utils/cn"

interface Props {
	children: React.ReactNode | React.ReactNode[]
	className: string
}

const Card: React.FC<Props> = ({ children, className }) => {
	return (
		<div
			className={cn(
				"rounded-md border border-border bg-surface shadow-lg shadow-[#00000016]",
				className
			)}
		>
			{children}
		</div>
	)
}

export default Card
