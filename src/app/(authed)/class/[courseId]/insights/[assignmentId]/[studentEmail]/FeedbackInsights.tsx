"use client"
import { useState } from "react"
import { produce } from "immer"

import { type FeedbackInsights } from "~/data/Feedback"
import { type Assignment } from "~/data/Assignment"
import FeedbackContent from "../../../feedback/[assignmentId]/FeedbackContent"
import FeedbackHeader from "../../../feedback/[assignmentId]/FeedbackHeader"

interface Props {
	assignment: Assignment
	submissionHTML: string
	insights: FeedbackInsights
}

export default function FeedbackInsights({
	assignment,
	submissionHTML,
	insights: insightsProp,
}: Props) {
	type FeedbackState = "focus" | "hover" | undefined

	const [insights, setInsights] = useState(
		insightsProp.map((insight) => ({
			...insight,
			state: undefined as FeedbackState,
		}))
	)

	return (
		<div className="relative h-full overflow-y-auto overflow-x-hidden rounded-md border border-border bg-white pt-16 shadow-lg shadow-[#00000016]">
			<div className="flex">
				<div className="min-w-[192px] flex-[0.75]" />

				<div className="w-[704px]">
					<FeedbackHeader assignment={assignment} />

					<hr className="mt-2 mb-3" />
				</div>

				<div className="min-w-[192px] flex-1" />
			</div>

			<FeedbackContent
				submissionHTML={submissionHTML}
				feedbackInsights={insights}
				onChangeFeedbackState={({ paragraph, state }) =>
					setInsights(
						produce((prevInsights) => {
							if (prevInsights === undefined) return

							if (paragraph !== undefined)
								prevInsights
									.filter((insight) =>
										insight.paragraphs.includes(paragraph)
									)
									.reduce<(typeof prevInsights)[0]>(
										(prev, cur) =>
											cur.paragraphs.length <
											prev.paragraphs.length
												? cur
												: prev,
										{
											paragraphs: Array(9999).fill(0),
											content: "",
											type: "strength",
											state: undefined,
										}
									).state = state
							else
								prevInsights.forEach((insight) => {
									if (insight.paragraphs.includes(-1))
										insight.state = state
								})
						})
					)
				}
			/>
		</div>
	)
}
