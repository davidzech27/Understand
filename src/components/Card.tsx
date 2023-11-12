import cn from "../utils/cn"

interface Props {
	children: React.ReactNode | React.ReactNode[]
	className: string
}

export default function Card({ children, className }: Props) {
	return (
		<div
			className={cn(
				"rounded-md border border-border bg-surface shadow-lg shadow-[#00000016]",
				className,
			)}
		>
			{children}
		</div>
	)
}
