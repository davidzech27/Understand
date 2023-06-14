"use client"
import { useState, useTransition } from "react"
import Link from "next/link"

import Avatar from "~/components/Avatar"
import FormattedDate from "~/utils/FormattedDate"
import getFeedbackHistoryAction from "./getFeedbackHistoryAction"
import Button from "~/components/Button"

interface Props {
	courseId: string
	initialFeedbackHistory: {
		assignmentId: string
		assignmentTitle: string
		userEmail: string
		userName: string
		userPhoto: string | undefined
		givenAt: Date
	}[]
	cursor: number | undefined
}

const FeedbackHistory: React.FC<Props> = ({
	courseId,
	initialFeedbackHistory,
	cursor: cursorProp,
}) => {
	const [feedbackHistory, setFeedbackHistory] = useState(
		initialFeedbackHistory
	)

	const [cursor, setCursor] = useState(cursorProp)

	const [isLoadingMore, loadMore] = useTransition()

	const onLoadMore = () => {
		if (cursor !== undefined)
			loadMore(() => {
				getFeedbackHistoryAction({ courseId, limit: 20, cursor }).then(
					({ feedbackHistory, cursor }) => {
						setFeedbackHistory((previousFeedbackHistory) => [
							...previousFeedbackHistory,
							...feedbackHistory,
						])

						setCursor(cursor)
					}
				)
			})
	}

	return (
		<>
			{feedbackHistory.map(
				(
					{
						userName,
						userEmail,
						userPhoto,
						assignmentId,
						assignmentTitle,
						givenAt,
					},
					index
				) => (
					<Link
						key={index}
						href={`/class/${courseId}/feedback/${assignmentId}/${userEmail}/${givenAt.valueOf()}`}
					>
						<div className="flex h-20 select-text items-center justify-between rounded-md border-[0.75px] border-border pl-6 pr-8 transition duration-150 hover:bg-surface-hover">
							<div className="flex items-center">
								<Avatar
									src={userPhoto}
									name={userName}
									fallbackColor="primary"
									className="h-11 w-11 rounded-full"
								/>

								<div className="ml-3 flex flex-col">
									<span className="mb-[2px] font-medium leading-none opacity-90">
										{userName}
									</span>

									<span className="text-sm opacity-60">
										{assignmentTitle}
									</span>
								</div>
							</div>

							<span className="opacity-60">
								<FormattedDate date={givenAt} />
							</span>
						</div>
					</Link>
				)
			)}

			{
				cursor && (
					<Button
						onClick={onLoadMore}
						loading={isLoadingMore}
						className="h-20 text-3xl"
					>
						Load more
					</Button>
				)
				// <button
				// 	onClick={onLoadMore}
				// 	className="h-20 w-full rounded-md border-[0.75px] border-border transition duration-150 hover:bg-surface-hover"
				// >
				// 	<span className="text-3xl font-medium opacity-80">
				// 		Load more
				// 	</span>
				// </button>
			}
		</>
	)
}

export default FeedbackHistory