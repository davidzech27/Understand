import { type Assignment } from "~/data/Assignment"

interface Props {
	assignment: Assignment
	buttons?: React.ReactNode
}

export default function FeedbackHeader({ assignment, buttons }: Props) {
	return (
		<div className="flex flex-col">
			<div className="flex items-end justify-between">
				<div className="select-text text-2xl font-bold">
					{assignment.title}
				</div>

				<div className="flex-1" />

				<div className="flex-shrink-0 gap-1.5">{buttons}</div>
			</div>

			{assignment.description !== undefined && (
				<p className="mt-3.5 mb-0.5 select-text text-sm text-black/60">
					{assignment.description}
				</p>
			)}
		</div>
	)
}
