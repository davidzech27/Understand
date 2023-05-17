"use client"
import { useState } from "react"
import { useRouter, useSelectedLayoutSegment } from "next/navigation"
import { Settings2 } from "lucide-react"
import { useZact } from "zact/client"
import Link from "next/link"
import * as Form from "@radix-ui/react-form"

import ToggleButton from "~/components/ToggleButton"
import Button from "~/components/Button"
import FancyButton from "~/components/FancyButton"
import TextInput from "~/components/TextInput"
import ListInput from "~/components/ListInput"
import Modal from "~/components/Modal"
import updateCourseAction from "./updateCourseAction"
import deleteCourseAction from "./deleteCourseAction"

interface Props {
	course: { id: string; name: string; section?: string; linkedUrl?: string }
	teacherEmails: string[]
	studentEmails: string[]
	role: "teacher" | "student"
}

const ClassTabs: React.FC<Props> = ({
	course,
	teacherEmails,
	studentEmails,
	role,
}) => {
	const segment = useSelectedLayoutSegment()

	const router = useRouter()

	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	const [nameInput, setNameInput] = useState(course.name)
	const [sectionInput, setSectionInput] = useState(course.section ?? "")
	const [teacherEmailInputs, setTeacherEmailInputs] = useState(teacherEmails)
	const [studentEmailInputs, setStudentEmailInputs] = useState(studentEmails)

	const updateDisabled =
		(nameInput === course.name &&
			sectionInput === course.section &&
			teacherEmails.length === teacherEmailInputs.length &&
			teacherEmails.every(
				(email, index) => teacherEmailInputs[index] === email
			) &&
			studentEmails.length === studentEmailInputs.length &&
			studentEmails.every(
				(email, index) => studentEmailInputs[index] === email
			)) ||
		nameInput.trim().length === 0

	const [confirmingDeleteClass, setConfirmingDeleteClass] = useState(false)

	const { mutate: updateCourse, isLoading: isUpdatingCourse } =
		useZact(updateCourseAction)

	const onUpdateCourse = async () => {
		if (updateDisabled) return

		const teacherEmailInputsFiltered = teacherEmailInputs.filter(Boolean)
		const studentEmailInputsFiltered = studentEmailInputs.filter(Boolean)

		await updateCourse({
			id: course.id,
			name: nameInput.trim(),
			section: sectionInput.trim() || undefined,
			addTeacherEmails: teacherEmailInputsFiltered.filter(
				(email) => !teacherEmails.includes(email)
			),
			removeTeacherEmails: teacherEmails.filter(
				(email) => !teacherEmailInputsFiltered.includes(email)
			),
			addStudentEmails: studentEmailInputsFiltered.filter(
				(email) => !studentEmails.includes(email)
			),
			removeStudentEmails: studentEmails.filter(
				(email) => !studentEmailInputsFiltered.includes(email)
			),
		})

		setSettingsModalOpen(false)

		router.refresh()
	}

	const { mutate: deleteCourse, isLoading: isDeletingCourse } =
		useZact(deleteCourseAction)

	const onDeleteCourse = async () => {
		await deleteCourse({ id: course.id })

		router.refresh()

		router.push("/home")
	}

	return (
		<div className="flex items-center justify-between">
			<div className="flex space-x-1.5">
				<Link href={`/class/${course.id}`} legacyBehavior>
					<a>
						<ToggleButton
							toggled={segment === null}
							onToggle={() => {}}
						>
							Home
						</ToggleButton>
					</a>
				</Link>

				<Link href={`/class/${course.id}/assignments`} legacyBehavior>
					<a>
						<ToggleButton
							toggled={segment === "assignments"}
							onToggle={() => {}}
						>
							Assignments
						</ToggleButton>
					</a>
				</Link>

				<Link href={`/class/${course.id}/people`} legacyBehavior>
					<a>
						<ToggleButton
							toggled={segment === "people"}
							onToggle={() => {}}
						>
							People
						</ToggleButton>
					</a>
				</Link>

				{role === "teacher" && (
					<Link href={`/class/${course.id}/insights`} legacyBehavior>
						<a>
							<ToggleButton
								toggled={segment === "insights"}
								onToggle={() => {}}
							>
								Insights
							</ToggleButton>
						</a>
					</Link>
				)}
			</div>

			{role === "teacher" && (
				<div
					onClick={() => setSettingsModalOpen(true)}
					className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-all duration-150 hover:bg-surface-hover"
				>
					<Settings2
						size={20}
						className="opacity-80 transition-all duration-150 group-hover:opacity-60"
					/>
				</div>
			)}

			<Modal
				open={settingsModalOpen}
				setOpen={setSettingsModalOpen}
				title="Class settings"
			>
				<Form.Root
					onSubmit={(e) => {
						e.preventDefault()

						onUpdateCourse()
					}}
					className="flex h-full flex-col justify-between space-y-2"
				>
					<div className="flex h-full flex-col space-y-2">
						<div className="ml-1 font-medium opacity-80">Name</div>

						<TextInput
							value={nameInput}
							setValue={setNameInput}
							placeholder="Class name"
							className="h-min py-2.5 pl-4 text-base"
						/>

						<div className="ml-1 font-medium opacity-80">
							Section
						</div>

						<TextInput
							value={sectionInput}
							setValue={setSectionInput}
							placeholder="Class section"
							className="h-min py-2.5 pl-4 text-base"
						/>

						<div className="h-[calc(60vh-6.5rem-19.5rem)] overflow-y-scroll">
							<div className="flex-col space-y-2">
								<div className="ml-1 font-medium opacity-80">
									Students
								</div>

								<ListInput
									values={studentEmailInputs}
									setValues={setStudentEmailInputs}
									singleWord
									placeholder="Student email"
									className="h-min"
									textInputClassname="py-2.5 pl-4 text-base w-[calc(33.333333%-27.333306px)] h-min"
									buttonClassName="h-[46px] w-[46px]"
								/>

								<div className="ml-1 font-medium opacity-80">
									Teachers
								</div>

								<ListInput
									values={teacherEmailInputs}
									setValues={setTeacherEmailInputs}
									singleWord
									placeholder="Teacher email"
									className="h-min"
									textInputClassname="py-2.5 pl-4 text-base w-[calc(33.333333%-27.333306px)] h-min"
									buttonClassName="h-[46px] w-[46px]"
								/>
							</div>
						</div>
					</div>

					<div className="flex space-x-3">
						<>
							<Button
								onClick={() => setConfirmingDeleteClass(true)}
								disabled={confirmingDeleteClass}
								type="button"
								className="text-lg"
							>
								Delete class
							</Button>

							{confirmingDeleteClass && (
								<>
									<Button
										onClick={onDeleteCourse}
										type="button"
										loading={isDeletingCourse}
										className="text-lg"
									>
										Do you really want to delete this class?
									</Button>

									{!isDeletingCourse && (
										<Button
											onClick={() =>
												setConfirmingDeleteClass(false)
											}
											type="button"
											className="text-lg"
										>
											Actually, never mind
										</Button>
									)}
								</>
							)}
						</>
					</div>

					<div className="flex space-x-3">
						<Form.Submit className="w-1/2">
							<FancyButton
								loading={isUpdatingCourse}
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

export default ClassTabs
