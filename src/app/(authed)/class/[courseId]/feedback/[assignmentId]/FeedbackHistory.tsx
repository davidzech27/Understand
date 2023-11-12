import { useEffect, useRef } from "react"

import { type Feedback } from "~/data/Feedback"
import cn from "~/utils/cn"
import formatDate from "~/utils/formatDate"
import ListItem from "~/components/ListItem"

interface Props {
	feedbackHistory: Feedback[]
	selectedFeedback: Feedback | undefined
	onSelectFeedback: (feedback: Feedback) => void
}

export default function FeedbackHistory({
	feedbackHistory,
	selectedFeedback,
	onSelectFeedback,
}: Props) {
	const scrollerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (scrollerRef.current)
			scrollerRef.current.scrollLeft = scrollerRef.current.scrollWidth
	}, [])

	return (
		<div ref={scrollerRef} className="overflow-x-auto">
			<ul className="flex w-max gap-1.5">
				{feedbackHistory.map((feedback, index) => (
					<ListItem
						onClick={() => onSelectFeedback(feedback)}
						key={index}
						className={cn(
							"flex h-16 cursor-pointer items-center justify-between px-6",
							selectedFeedback?.givenAt.valueOf() ===
								feedback.givenAt.valueOf()
								? "bg-surface-selected hover:bg-surface-selected-hover"
								: "hover:bg-surface-hover",
						)}
					>
						<span className="font-medium opacity-80">
							{formatDate(feedback.givenAt)}
						</span>
					</ListItem>
				))}
			</ul>
		</div>
	)
}
