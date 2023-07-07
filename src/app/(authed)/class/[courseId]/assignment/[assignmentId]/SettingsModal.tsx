import { useState } from "react"
import { useRouter } from "next/navigation"
import { useZact } from "zact/client"
import * as Form from "@radix-ui/react-form"

import Button from "~/components/Button"
import FancyButton from "~/components/FancyButton"
import TextInput from "~/components/TextInput"
import Modal from "~/components/Modal"
import updateAssignmentAction from "./updateAssignmentAction"
import deleteAssignmentAction from "./deleteAssignmentAction"
import TextArea from "~/components/TextArea"

interface Props {
	open: boolean
	setOpen: (open: boolean) => void
	assignment: {
		courseId: string
		assignmentId: string
		title: string
		description?: string
		instructions?: string
		instructionsLinked: boolean
		context?: string
		dueAt?: Date
	}
}

const SettingsModal: React.FC<Props> = ({ open, setOpen, assignment }) => {
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
			instructionsLinked:
				assignment.instructionsLinked &&
				instructionsInput.trim() === assignment.instructions?.trim(),
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
			<Form.Root
				onSubmit={(e) => {
					e.preventDefault()

					onUpdateAssignment()
				}}
				className="relative h-full"
			>
				<div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col space-y-2 overflow-y-scroll pb-[100px]">
					<div className="ml-1 font-medium opacity-80">Title</div>

					<TextInput
						value={titleInput}
						setValue={setTitleInput}
						placeholder="Assignment title"
						autoComplete="off"
						className="h-min py-2.5 pl-4 text-base"
					/>

					<div className="ml-1 font-medium opacity-80">
						Description
					</div>

					<TextInput
						value={descriptionInput}
						setValue={setDescriptionInput}
						placeholder="Description"
						autoComplete="off"
						className="h-min py-2.5 pl-4 text-base"
					/>

					<div className="ml-1 font-medium opacity-80">
						Instructions
					</div>

					<div>
						<TextArea
							value={instructionsInput}
							setValue={setInstructionsInput}
							placeholder="Instructions"
							autoComplete="off"
							className="py-2.5 pl-4 text-base"
						/>
					</div>

					<div className="flex space-x-3 pt-3">
						<Button
							onClick={() => setConfirmingDeleteAssignment(true)}
							type="button"
							disabled={confirmingDeleteAssignment}
							className="text-lg"
						>
							Delete assignment
						</Button>

						{confirmingDeleteAssignment && (
							<>
								<Button
									onClick={onDeleteAssignment}
									type="button"
									loading={isDeletingAssignment}
									className="text-lg"
								>
									Do you really want to delete this
									assignment?
								</Button>

								{!isDeletingAssignment && (
									<Button
										onClick={() =>
											setConfirmingDeleteAssignment(false)
										}
										type="button"
										className="text-lg"
									>
										Actually, never mind
									</Button>
								)}
							</>
						)}
					</div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 z-50 flex space-x-3">
					<Form.Submit asChild className="w-1/2">
						<FancyButton
							loading={isUpdatingAssignment}
							disabled={updateDisabled}
							className="h-20 text-3xl"
						>
							Done
						</FancyButton>
					</Form.Submit>

					<Button
						type="button"
						onClick={() => setOpen(false)}
						className="h-20 w-1/2 text-3xl"
					>
						Cancel
					</Button>
				</div>
			</Form.Root>
		</Modal>
	)
}

export default SettingsModal
