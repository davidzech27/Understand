import { useState } from "react"

import { type Feedback } from "~/data/Feedback"
import updateFeedbackSharedAction from "./updateFeedbackSharedAction"
import Modal from "~/components/Modal"
import Button from "~/components/Button"
import Heading from "~/components/Heading"

interface Props {
	open: boolean
	setOpen: (open: boolean) => void
	shared: boolean
	onChangeShared: (shared: boolean) => void
	courseId: string
	assignmentId: string
	email: string
	feedbackGivenAt: Date
}

export default function ShareModal({
	open,
	setOpen,
	shared,
	onChangeShared,
	courseId,
	assignmentId,
	email,
	feedbackGivenAt,
}: Props) {
	const [linkCopied, setLinkCopied] = useState(false)

	return (
		<Modal open={open} setOpen={setOpen} title="Share your feedback">
			<div className="flex h-full flex-col justify-between">
				<div>
					<Heading size="large">
						Who should be able to access your feedback?
					</Heading>

					<div className="mt-2 flex gap-1.5">
						<Button
							size="medium"
							onClick={() => {
								onChangeShared(false)

								updateFeedbackSharedAction({
									courseId,
									assignmentId,
									givenAt: feedbackGivenAt,
									shared: false,
								})
							}}
							disabled={!shared}
						>
							Just you and your teachers
						</Button>

						<Button
							size="medium"
							onClick={() => {
								onChangeShared(true)

								updateFeedbackSharedAction({
									courseId,
									assignmentId,
									givenAt: feedbackGivenAt,
									shared: true,
								})
							}}
							disabled={shared}
						>
							Anyone with the link
						</Button>
					</div>
				</div>

				<div className="flex gap-3">
					<Button
						size="large"
						onClick={() => {
							setLinkCopied(true)

							navigator.clipboard.writeText(
								`${
									window.location.href
								}/${email}/${feedbackGivenAt.valueOf()}`
							)
						}}
					>
						{!linkCopied ? "Copy link" : "Link copied"}
					</Button>

					<Button size="large" onClick={() => setOpen(false)}>
						Done
					</Button>
				</div>
			</div>
		</Modal>
	)
}
