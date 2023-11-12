import { useState } from "react"

import Modal from "~/components/Modal"
import Button from "~/components/Button"
import SelectList from "~/components/SelectList"
import AttachmentItem from "~/components/AttachmentItem"

interface Props {
	open: boolean
	setOpen: (open: boolean) => void
	linkedSubmissions: {
		id: string
		title?: string
		url: string
		thumbnailUrl?: string
		htmlPromise: Promise<string>
	}[]
	onPick: ({ id }: { id: string }) => void
}

export default function LinkedSubmissionModal({
	open,
	setOpen,
	linkedSubmissions,
	onPick,
}: Props) {
	const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>()

	return (
		<Modal title="Pick a submission" open={open} setOpen={setOpen}>
			<div className="flex h-full flex-col justify-between">
				<SelectList
					items={linkedSubmissions}
					selectionType="single"
					selectionSet={
						new Set(
							selectedSubmissionId ? [selectedSubmissionId] : [],
						)
					}
					setSelectionSet={(value) => {
						if (typeof value === "object") {
							setSelectedSubmissionId([...value][0])
						} else {
							setSelectedSubmissionId(
								[
									...value(
										new Set(
											selectedSubmissionId
												? [selectedSubmissionId]
												: [],
										),
									),
								][0],
							)
						}
					}}
					renderItem={({
						item: { title, thumbnailUrl, url },
						selected,
					}) => (
						<AttachmentItem
							name={title ?? ""}
							photo={thumbnailUrl}
							url={url}
							selected={selected}
						/>
					)}
					renderEmpty={() => null}
				/>

				<Button
					onClick={() => {
						selectedSubmissionId &&
							onPick({ id: selectedSubmissionId })

						setOpen(false)
					}}
					disabled={selectedSubmissionId === undefined}
					size="large"
				>
					Pick attachment
				</Button>
			</div>
		</Modal>
	)
}
