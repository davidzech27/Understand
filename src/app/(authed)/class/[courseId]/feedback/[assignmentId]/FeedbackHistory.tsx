import { useEffect, useRef, useState } from "react"

import { type Feedback } from "~/data/Feedback"
import cn from "~/utils/cn"
import formatDate from "~/utils/formatDate"
import ListItem from "~/components/ListItem"

interface Props {
	feedbackHistory: Feedback[]
	selectedFeedback: Feedback | undefined
	onSelectFeedback: (feedback: Feedback) => void
	email: string
}

export default function FeedbackHistory({
	feedbackHistory,
	selectedFeedback,
	onSelectFeedback,
	email,
}: Props) {
	const [copiedLinkFeedbackGivenAt, setCopiedLinkFeedbackGivenAt] =
		useState<Date>()

	const scrollerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (scrollerRef.current)
			scrollerRef.current.scrollLeft = scrollerRef.current.scrollWidth
	}, [])

	return (
		<div ref={scrollerRef} className="overflow-x-auto">
			<ul className="flex w-max space-x-1.5">
				{feedbackHistory.map((feedback, index) => (
					<ListItem
						onClick={() => onSelectFeedback(feedback)}
						key={index}
						className={cn(
							"flex h-16 w-[304px] cursor-pointer items-center justify-between pl-6 pr-3.5",
							selectedFeedback?.givenAt.valueOf() ===
								feedback.givenAt.valueOf()
								? "bg-surface-selected hover:bg-surface-selected-hover"
								: "hover:bg-surface-hover"
						)}
					>
						<span className="font-medium opacity-80">
							{formatDate(feedback.givenAt)}
						</span>

						<button
							className={cn(
								"rounded-md border-border px-3 py-1.5 text-sm font-medium opacity-60 transition-all duration-150 hover:bg-surface-selected-hover",
								selectedFeedback?.givenAt.valueOf() ===
									feedback.givenAt.valueOf()
									? "hover:opacity-80"
									: "hover:opacity-100"
							)}
							onClick={(e) => {
								e.stopPropagation()

								navigator.clipboard.writeText(
									`${
										window.location.href
									}/${email}/${feedback.givenAt.valueOf()}`
								)

								setCopiedLinkFeedbackGivenAt(feedback.givenAt)
							}}
						>
							{feedback.givenAt.valueOf() ===
							copiedLinkFeedbackGivenAt?.valueOf()
								? "Link copied"
								: "Copy link"}
						</button>
					</ListItem>
				))}
			</ul>
		</div>
	)
}
