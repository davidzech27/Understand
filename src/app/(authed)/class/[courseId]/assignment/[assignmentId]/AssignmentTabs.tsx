"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings2 } from "lucide-react"
import { useZact } from "zact/client"
import * as Form from "@radix-ui/react-form"

import Button from "~/components/Button"
import FancyButton from "~/components/FancyButton"
import TextInput from "~/components/TextInput"
import Modal from "~/components/Modal"
import updateAssignmentAction from "./updateAssignmentAction"
import deleteAssignmentAction from "./deleteAssignmentAction"

interface Props {
	assignment: {
		courseId: string
		assignmentId: string
		title: string
		studentDescription?: string
		instructions: string
		dueAt?: Date
	}
}

const AssignmentTabs: React.FC<Props> = ({ assignment }) => {
	const router = useRouter()

	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	const [titleInput, setTitleInput] = useState(assignment.title)
	const [studentDescriptionInput, setStudentDescriptionInput] = useState(
		assignment.studentDescription ?? ""
	)
	const [instructionsInput, setInstructionsInput] = useState(
		assignment.instructions
	)

	const [feedbackLinkCopied, setFeedbackLinkCopied] = useState(false)

	const updateDisabled =
		(titleInput === assignment.title &&
			studentDescriptionInput === assignment.studentDescription &&
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
			studentDescription: studentDescriptionInput.trim() || undefined,
			instructions: instructionsInput.trim(),
		})

		setSettingsModalOpen(false)

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
		<div className="flex items-center justify-between">
			<div className="flex space-x-1.5">
				<Button
					onClick={() => {
						navigator.clipboard.writeText(
							window.location.href.replace(
								"assignment",
								"feedback"
							)
						)

						setFeedbackLinkCopied(true)
					}}
					className="text-base"
				>
					{!feedbackLinkCopied
						? "Copy student feedback link"
						: "Student feedback link copied"}
				</Button>
			</div>

			<div
				onClick={() => setSettingsModalOpen(true)}
				className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-all duration-150 hover:bg-surface-hover"
			>
				<Settings2
					size={20}
					className="opacity-80 transition-all duration-150 group-hover:opacity-60"
				/>
			</div>

			<Modal
				open={settingsModalOpen}
				setOpen={setSettingsModalOpen}
				title="Assignment settings"
			>
				<Form.Root
					onSubmit={(e) => {
						e.preventDefault()

						onUpdateAssignment()
					}}
					className="flex h-full flex-col justify-between"
				>
					<div className="flex flex-col space-y-2">
						<div className="ml-1 font-medium opacity-80">Title</div>

						<TextInput
							value={titleInput}
							setValue={setTitleInput}
							placeholder="Assignment title"
							className="py-2.5 pl-4 text-base"
						/>

						<div className="ml-1 font-medium opacity-80">
							Description
						</div>

						<TextInput
							value={studentDescriptionInput}
							setValue={setStudentDescriptionInput}
							placeholder="Description"
							className="py-2.5 pl-4 text-base"
						/>

						<div className="ml-1 font-medium opacity-80">
							Instructions
						</div>

						<TextInput
							value={instructionsInput}
							setValue={setInstructionsInput}
							placeholder="Instructions"
							className="py-2.5 pl-4 text-base"
						/>

						<div className="flex space-x-3 pt-3">
							{!confirmingDeleteAssignment ? (
								<Button
									onClick={() =>
										setConfirmingDeleteAssignment(true)
									}
									type="button"
									className="text-lg"
								>
									Delete assignment
								</Button>
							) : (
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
												setConfirmingDeleteAssignment(
													false
												)
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

					<div className="flex space-x-3">
						<Form.Submit className="w-1/2">
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
							onClick={() => setSettingsModalOpen(false)}
							className="h-20 w-1/2 text-3xl"
						>
							Cancel
						</Button>
					</div>
				</Form.Root>
			</Modal>
		</div>
	)
}

export default AssignmentTabs
