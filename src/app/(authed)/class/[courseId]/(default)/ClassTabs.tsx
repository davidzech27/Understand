"use client"
import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Settings2 } from "lucide-react"
import { useZact } from "zact/client"

import updateCourseAction from "./updateCourseAction"
import deleteCourseAction from "./deleteCourseAction"
import Label from "~/components/Label"
import LinkButton from "~/components/LinkButton"
import Button from "~/components/Button"
import FancyButton from "~/components/FancyButton"
import TextInput from "~/components/TextInput"
import Modal from "~/components/Modal"
import InputList from "~/components/InputList"

interface Props {
	course: { id: string; name: string; section?: string; linkedUrl?: string }
	teacherEmailsPromise: Promise<string[]>
	studentEmailsPromise: Promise<string[]>
	role: "teacher" | "student"
	hasResources: boolean
}

export default function ClassTab({
	course,
	teacherEmailsPromise,
	studentEmailsPromise,
	role,
	hasResources,
}: Props) {
	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	return (
		<div className="flex items-center justify-between">
			<div className="flex space-x-1.5">
				<LinkButton href={`/class/${course.id}`}>Home</LinkButton>

				<LinkButton href={`/class/${course.id}/assignments`}>
					Assignments
				</LinkButton>

				<LinkButton href={`/class/${course.id}/people`}>
					People
				</LinkButton>

				{hasResources && (
					<LinkButton href={`/class/${course.id}/chat`}>
						Chat
					</LinkButton>
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

			<SettingsModal
				open={settingsModalOpen}
				setOpen={setSettingsModalOpen}
				course={course}
				teacherEmailsPromise={teacherEmailsPromise}
				studentEmailsPromise={studentEmailsPromise}
			/>
		</div>
	)
}

interface SettingsModalProps {
	open: boolean
	setOpen: (open: boolean) => void
	course: {
		id: string
		name: string
		section?: string
	}
	teacherEmailsPromise: Promise<string[]>
	studentEmailsPromise: Promise<string[]>
}

const SettingsModal: React.FC<SettingsModalProps> = ({
	open,
	setOpen,
	course,
	teacherEmailsPromise,
	studentEmailsPromise,
}) => {
	const router = useRouter()

	const teacherEmails = use(teacherEmailsPromise)
	const studentEmails = use(studentEmailsPromise)

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

		setOpen(false)

		router.refresh()
	}

	const { mutate: deleteCourse, isLoading: isDeletingCourse } =
		useZact(deleteCourseAction)

	const onDeleteCourse = async () => {
		await deleteCourse({ id: course.id })

		router.push("/home")
	}

	return (
		<Modal open={open} setOpen={setOpen} title="Class settings">
			<form
				onSubmit={(e) => {
					e.preventDefault()

					onUpdateCourse()
				}}
				className="relative h-full"
			>
				<div className="absolute top-0 bottom-0 left-0 right-0 flex flex-col space-y-2 overflow-y-scroll pb-[100px]">
					<Label>Name</Label>

					<TextInput
						value={nameInput}
						setValue={setNameInput}
						placeholder="Class name"
						id="name"
						className="h-min py-2.5 pl-4 text-base"
					/>

					<Label>Section</Label>

					<TextInput
						value={sectionInput}
						setValue={setSectionInput}
						placeholder="Class section"
						id="section"
						className="h-min py-2.5 pl-4 text-base"
					/>

					<Label>Students</Label>

					<InputList
						values={studentEmailInputs}
						setValues={setStudentEmailInputs}
						singleWord
						id="students"
						placeholder="Student email"
						autoComplete="off"
						className="h-min"
						textInputClassname="py-2.5 pl-4 text-base w-[calc(33.333333%-27.333306px)] h-min"
						buttonClassName="h-[46px] w-[46px]"
					/>

					<Label>Teachers</Label>

					<InputList
						values={teacherEmailInputs}
						setValues={setTeacherEmailInputs}
						singleWord
						placeholder="Teacher email"
						id="teachers"
						autoComplete="off"
						className="h-min"
						textInputClassname="py-2.5 pl-4 text-base w-[calc(33.333333%-27.333306px)] h-min"
						buttonClassName="h-[46px] w-[46px]"
					/>

					<div className="flex space-x-3 pt-3">
						<Button
							onClick={() => setConfirmingDeleteClass(true)}
							disabled={confirmingDeleteClass}
							type="button"
							size="medium"
						>
							Delete class
						</Button>

						{confirmingDeleteClass && (
							<>
								<Button
									onClick={onDeleteCourse}
									type="button"
									loading={isDeletingCourse}
									size="medium"
								>
									Do you really want to delete this class?
								</Button>

								{!isDeletingCourse && (
									<Button
										onClick={() =>
											setConfirmingDeleteClass(false)
										}
										type="button"
										size="medium"
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
						type="submit"
						loading={isUpdatingCourse}
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
