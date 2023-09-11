"use client"
import { useState } from "react"
import { produce } from "immer"

import { type Feedback } from "~/data/Feedback"
import { type Assignment } from "~/data/Assignment"
import FeedbackContent from "../../FeedbackContent"
import FeedbackHeader from "../../FeedbackHeader"

interface Props {
	assignment: Assignment
	feedback: Feedback
}

export default function Feedback({
	assignment,
	feedback: feedbackProp,
}: Props) {
	type FeedbackState = "focus" | "hover" | undefined

	const [feedback, setFeedback] = useState({
		...feedbackProp,
		list: feedbackProp.list.map((feedbackItem) => ({
			...feedbackItem,
			state: undefined as FeedbackState,
		})),
	})

	return (
		<div className="relative h-full overflow-y-auto overflow-x-hidden rounded-md border border-border bg-white pt-16 shadow-lg shadow-[#00000016]">
			<div className="flex">
				<div className="min-w-[192px] flex-[0.75]" />

				<div className="w-[704px]">
					<FeedbackHeader assignment={assignment} />

					<hr className="mb-3 mt-2" />
				</div>

				<div className="min-w-[192px] flex-1" />
			</div>

			<FeedbackContent
				submissionHTML={feedback.submissionHTML}
				feedbackList={feedback.list}
				onChangeFeedbackState={({ paragraph, sentence, state }) =>
					setFeedback(
						produce((prevFeedback) => {
							if (prevFeedback === undefined) return

							const changedFeedback = prevFeedback.list.find(
								(feedbackItem) =>
									feedbackItem.paragraph === paragraph &&
									feedbackItem.sentence === sentence
							)

							if (changedFeedback)
								changedFeedback.state =
									typeof state === "function"
										? state(changedFeedback.state)
										: state
						})
					)
				}
			/>
		</div>
	)
}
