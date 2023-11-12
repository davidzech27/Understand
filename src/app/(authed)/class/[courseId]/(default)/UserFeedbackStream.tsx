"use client"
import { useState, useTransition } from "react"
import Link from "next/link"

import formatDate from "~/utils/formatDate"
import getUserFeedbackStreamAction from "./getUserFeedbackStreamAction"
import Avatar from "~/components/Avatar"
import Button from "~/components/Button"

interface Props {
	courseId: string
	userEmail: string
	initialFeedbackStream: {
		assignmentId: string
		assignmentTitle: string
		givenAt: Date
	}[]
	cursor: number | undefined
}

export default function UserFeedbackStream({
	courseId,
	userEmail,
	initialFeedbackStream,
	cursor: cursorProp,
}: Props) {
	const [feedbackStream, setFeedbackStream] = useState(initialFeedbackStream)

	const [cursor, setCursor] = useState(cursorProp)

	const [isLoadingMore, loadMore] = useTransition()

	const onLoadMore = () => {
		if (cursor !== undefined)
			loadMore(async () => {
				const { feedbackStream, cursor: newCursor } =
					await getUserFeedbackStreamAction({
						courseId,
						limit: 20,
						cursor,
					})

				setFeedbackStream((previousFeedbackStream) => [
					...previousFeedbackStream,
					...feedbackStream,
				])

				setCursor(newCursor)
			})
	}

	return (
		<>
			{feedbackStream.map(
				({ assignmentId, assignmentTitle, givenAt }, index) => (
					<Link
						key={index}
						href={`/class/${courseId}/feedback/${assignmentId}/${userEmail}/${givenAt.valueOf()}`}
					>
						<div className="flex h-20 select-text items-center justify-between rounded-md border-[0.75px] border-border pl-6 pr-8 transition duration-150 hover:bg-surface-hover">
							<div className="flex items-center">
								<Avatar
									src={undefined}
									name={assignmentTitle}
									fallbackColor="primary"
									className="h-11 w-11 rounded-full"
								/>

								<div className="ml-3 flex flex-col font-medium leading-none opacity-90">
									{assignmentTitle}
								</div>
							</div>

							<span className="opacity-60">
								{formatDate(givenAt)}
							</span>
						</div>
					</Link>
				),
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
