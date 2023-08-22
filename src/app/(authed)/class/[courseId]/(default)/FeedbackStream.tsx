"use client"
import { useState, useTransition } from "react"
import Link from "next/link"

import formatDate from "~/utils/formatDate"
import Avatar from "~/components/Avatar"
import getFeedbackStreamAction from "./getFeedbackStreamAction"
import Button from "~/components/Button"

interface Props {
	courseId: string
	initialFeedbackStream: {
		assignmentId: string
		assignmentTitle: string
		userEmail: string
		userName: string
		userPhoto: string | undefined
		givenAt: Date
	}[]
	cursor: number | undefined
}

export default function FeedbackStream({
	courseId,
	initialFeedbackStream,
	cursor: cursorProp,
}: Props) {
	const [feedbackStream, setFeedbackStream] = useState(initialFeedbackStream)

	const [cursor, setCursor] = useState(cursorProp)

	const [isLoadingMore, loadMore] = useTransition()

	const onLoadMore = () => {
		if (cursor !== undefined)
			loadMore(() => {
				getFeedbackStreamAction({ courseId, limit: 20, cursor }).then(
					({ feedbackStream, cursor }) => {
						setFeedbackStream((previousFeedbackStream) => [
							...previousFeedbackStream,
							...feedbackStream,
						])

						setCursor(cursor)
					}
				)
			})
	}

	return (
		<>
			{feedbackStream.map(
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
								{formatDate(givenAt)}
							</span>
						</div>
					</Link>
				)
			)}

			{cursor && (
				<Button
					onClick={onLoadMore}
					loading={isLoadingMore}
					size="large"
				>
					Load more
				</Button>
			)}
		</>
	)
}
