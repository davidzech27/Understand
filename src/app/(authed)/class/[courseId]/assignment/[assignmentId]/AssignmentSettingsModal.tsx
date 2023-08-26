import { useState } from "react"
import { useRouter } from "next/navigation"
import { useZact } from "zact/client"

import { type Assignment } from "~/data/Assignment"
import updateAssignmentAction from "./updateAssignmentAction"
import deleteAssignmentAction from "./deleteAssignmentAction"
import Button from "~/components/Button"
import Label from "~/components/Label"
import FancyButton from "~/components/FancyButton"
import TextInput from "~/components/TextInput"
import Modal from "~/components/Modal"
import TextArea from "~/components/TextArea"

interface Props {
	open: boolean
	setOpen: (open: boolean) => void
	assignment: Assignment
}

export default function AssignmentSettingsModal({
	open,
	setOpen,
	assignment,
}: Props) {
	const router = useRouter()

	const [titleInput, setTitleInput] = useState(assignment.title)
	const [descriptionInput, setDescriptionInput] = useState(
		assignment.description ?? ""
	)
	const [instructionsInput, setInstructionsInput] = useState(
		assignment.instructions ?? ""
	)

	const updateDisabled =
		(titleInput === assignment.title &&
			descriptionInput === assignment.description &&
			instructionsInput === assignment.instructions) ||
		titleInput.trim().length === 0 ||
		instructionsInput.trim().length === 0

	const [confirmingDeleteAssignment, setConfirmingDeleteAssignment] =
		useState(false)

	const { mutate: updateAssignment, isLoading: isUpdatingAssignment } =
		useZact(updateAssignmentAction)

	const onUpdateAssignment = async () => {
		if (updateDisabled) return

		await updateAssignment({
			courseId: assignment.courseId,
			assignmentId: assignment.assignmentId,
			title: titleInput.trim(),
			description: descriptionInput.trim() || undefined,
			instructions: instructionsInput.trim(),
			dueAt: assignment.dueAt,
		})

		setOpen(false)

		router.refresh()
	}

	const { mutate: deleteAssignment, isLoading: isDeletingAssignment } =
		useZact(deleteAssignmentAction)

	const onDeleteAssignment = async () => {
		await deleteAssignment({
			courseId: assignment.courseId,
			assignmentId: assignment.assignmentId,
		})

		router.refresh()

		router.push(`/class/${assignment.courseId}`)
	}

	return (
		<Modal open={open} setOpen={setOpen} title="Assignment settings">
			<form
				onSubmit={(e) => {
					e.preventDefault()

					onUpdateAssignment()
				}}
				className="relative h-full"
			>
				<div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col space-y-2 overflow-y-scroll pb-[100px]">
					<Label>Title</Label>

					<TextInput
						value={titleInput}
						setValue={setTitleInput}
						placeholder="Assignment title"
						id="title"
						autoComplete="off"
						className="py-2.5 pl-4 text-base"
					/>

					<Label>Description</Label>

					<div>
						<TextArea
							value={descriptionInput}
							setValue={setDescriptionInput}
							placeholder="Description"
							id="description"
							autoComplete="off"
							className="py-2.5 pl-4 text-base"
						/>
					</div>

					<Label>Instructions</Label>

					<div>
						<TextArea
							value={instructionsInput}
							setValue={setInstructionsInput}
							placeholder="Instructions"
							id="instructions"
							autoComplete="off"
							className="py-2.5 pl-4 text-base"
						/>
					</div>

					<div className="flex space-x-3 pt-3">
						<Button
							size="medium"
							onClick={() => setConfirmingDeleteAssignment(true)}
							type="button"
							disabled={confirmingDeleteAssignment}
						>
							Delete assignment
						</Button>

						{confirmingDeleteAssignment && (
							<>
								<Button
									size="medium"
									onClick={onDeleteAssignment}
									type="button"
									loading={isDeletingAssignment}
								>
									Do you really want to delete this
									assignment?
								</Button>

								{!isDeletingAssignment && (
									<Button
										size="medium"
										onClick={() =>
											setConfirmingDeleteAssignment(false)
										}
										type="button"
									>
										Actually, never mind
									</Button>
								)}
							</>
						)}
					</div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 z-50 flex space-x-3">
					<FancyButton
						size="large"
						loading={isUpdatingAssignment}
						disabled={updateDisabled}
						className="w-1/2"
					>
						Done
					</FancyButton>

					<Button
						size="large"
						type="button"
						onClick={() => setOpen(false)}
						className="w-1/2"
					>
						Cancel
					</Button>
				</div>
			</form>
		</Modal>
	)
}
