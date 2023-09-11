import { useState, use } from "react"
import { useRouter } from "next/navigation"

import updateCourseAction from "./updateCourseAction"
import deleteCourseAction from "./deleteCourseAction"
import Label from "~/components/Label"
import Button from "~/components/Button"
import FancyButton from "~/components/FancyButton"
import TextInput from "~/components/TextInput"
import Modal from "~/components/Modal"
import InputList from "~/components/InputList"

interface Props {
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

export default function ClassSettingsModal({
	open,
	setOpen,
	course,
	teacherEmailsPromise,
	studentEmailsPromise,
}: Props) {
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

	const [updating, setUpdating] = useState(false)

	const onUpdateCourse = async () => {
		if (updateDisabled) return

		const teacherEmailInputsFiltered = teacherEmailInputs.filter(Boolean)
		const studentEmailInputsFiltered = studentEmailInputs.filter(Boolean)

		setUpdating(true)

		await updateCourseAction({
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

		setUpdating(false)
	}

	const [deleting, setDeleting] = useState(false)

	const onDeleteCourse = async () => {
		setDeleting(true)

		await deleteCourseAction({ id: course.id })

		router.refresh()

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
				<div className="absolute bottom-0 left-0 right-0 top-0 flex flex-col space-y-2 overflow-y-scroll pb-[100px]">
					<Label>Name</Label>

					<TextInput
						value={nameInput}
						setValue={setNameInput}
						placeholder="Class name"
						id="name"
						className="py-2.5 pl-4 text-base"
					/>

					<Label>Section</Label>

					<TextInput
						value={sectionInput}
						setValue={setSectionInput}
						placeholder="Class section"
						id="section"
						className="py-2.5 pl-4 text-base"
					/>

					<Label>Students</Label>

					<InputList
						values={studentEmailInputs}
						setValues={setStudentEmailInputs}
						singleWord
						id="students"
						placeholder="Student email"
						autoComplete="off"
						textInputClassname="h-min py-2.5 pl-4 text-base w-[calc(33.333333%-27.333306px)]"
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
						textInputClassname="h-min py-2.5 pl-4 text-base w-[calc(33.333333%-27.333306px)]"
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
									loading={deleting}
									size="medium"
								>
									Do you really want to delete this class?
								</Button>

								{!deleting && (
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
						loading={updating}
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
