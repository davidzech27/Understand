"use client"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

import { type User } from "~/data/User"
import createCourseAction from "./createCourseAction"
import getAuthenticationURL from "~/google/getAuthenticationURL"
import Heading from "~/components/Heading"
import TextInput from "~/components/TextInput"
import Card from "~/components/Card"
import InputList from "~/components/InputList"
import Label from "~/components/Label"
import Button from "~/components/Button"
import FancyButton from "~/components/FancyButton"
import Modal from "~/components/Modal"
import SelectList from "~/components/SelectList"
import AttachmentItem from "~/components/AttachmentItem"
import FeatureBlockModal from "~/limits/FeatureBlockModal"

interface Props {
	coursesPromise: Promise<
		| {
				name: string
				id: string
				section?: string
				url: string
				roster: Promise<{
					teachers: {
						name: string
						email?: string | undefined
						photo?: string | undefined
					}[]
					students: {
						email: string
						name: string
						photo?: string | undefined
					}[]
				}>
		  }[]
		| undefined
	>
	userPromise: Promise<User>
}

export default function CreateClassForm({
	coursesPromise,
	userPromise,
}: Props) {
	const router = useRouter()

	const [creating, setCreating] = useState(false)

	const onCreate = async () => {
		setCreating(true)

		const id =
			linkedCourse?.id ??
			new Date().valueOf().toString() +
				Math.floor(Math.random() * 1_000_000).toString() // milliseconds after epoch appended by 6 random digits

		await createCourseAction({
			id,
			name: nameInput.trim(),
			section: sectionInput.trim() || undefined,
			syncedAdditionalTeacherEmails:
				linkedCourse?.roster.additionalTeacherEmails ?? [],
			syncedStudentEmails: linkedCourse?.roster.studentEmails ?? [],
			unsyncedAdditionalTeacherEmails:
				additionalTeacherEmailInputs.filter(
					(email) =>
						!linkedCourse?.roster.additionalTeacherEmails.includes(
							email
						)
				),
			unsyncedStudentEmails: studentEmailInputs.filter(
				(email) => !linkedCourse?.roster.studentEmails.includes(email)
			),
			syncedUrl: linkedCourse?.url,
		})

		router.refresh()

		router.push(`/class/${id}`)
	}

	const onLink = async () => {
		const courses = await coursesPromise

		const user = await userPromise

		if (
			user.schoolDistrictName === undefined ||
			user.schoolName === undefined
		) {
			setFeatureBlockModalOpen(true)
		} else if (courses === undefined) {
			setLinkClassExplanationModalOpen(true)
		} else {
			setLinkClassModalOpen(true)
		}
	}

	const onReauthenticate = () => {
		window.location.href = getAuthenticationURL({
			scopes: [
				"https://www.googleapis.com/auth/classroom.courses.readonly",
				"https://www.googleapis.com/auth/classroom.rosters.readonly",
				"https://www.googleapis.com/auth/classroom.profile.emails",
				"https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
				"https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
				"https://www.googleapis.com/auth/drive.readonly",
			],
			redirectTo: "/class/create",
		})
	}

	const [linkClassModalOpen, setLinkClassModalOpen] = useState(false)

	const [featureBlockModalOpen, setFeatureBlockModalOpen] = useState(false)

	const [linkClassExplanationModalOpen, setLinkClassExplanationModalOpen] =
		useState(false)

	const [selectedCourseId, setSelectedCourseId] = useState<string>() // perhaps extract behavior to separate component

	const [courseLoading, setCourseLoading] = useState(false)

	const [linkedCourse, setLinkedCourse] = useState<{
		id: string
		name: string
		section?: string
		url: string
		roster: {
			additionalTeacherEmails: string[]
			studentEmails: string[]
		}
	}>()

	const onChooseClass = async () => {
		setCourseLoading(true)

		const courses = await coursesPromise

		if (!selectedCourseId || !courses) return

		const course = courses.find((course) => course.id === selectedCourseId)

		const roster = await course?.roster

		setCourseLoading(false)

		if (!course || !roster) return

		setNameInput(course.name)

		course.section && setSectionInput(course.section)

		const user = await userPromise

		setAdditionalTeacherEmailInputs(
			roster.teachers
				.map((teacher) => teacher.email)
				.filter(Boolean)
				.filter((email) => email !== user.email)
		)

		setStudentEmailInputs(
			roster.students
				.map((student) => student.email)
				.filter((email) => email !== user.email)
		)

		setLinkedCourse({
			...course,
			roster: {
				additionalTeacherEmails: roster.teachers
					.map((teacher) => teacher.email)
					.filter(Boolean)
					.filter((email) => email !== user.email),
				studentEmails: roster.students
					.map((student) => student.email)
					.filter((email) => email !== user.email),
			},
		})

		setLinkClassModalOpen(false)

		setSelectedCourseId(undefined)
	}

	const onUnlink = () => {
		setNameInput("")
		setSectionInput("")
		setStudentEmailInputs([""])
		setAdditionalTeacherEmailInputs([""])

		setLinkedCourse(undefined)
	}

	const [nameInput, setNameInput] = useState("")
	const [sectionInput, setSectionInput] = useState("")
	const [studentEmailInputs, setStudentEmailInputs] = useState([""])
	const [additionalTeacherEmailInputs, setAdditionalTeacherEmailInputs] =
		useState([""])

	return (
		<>
			<form
				onSubmit={(e) => {
					e.preventDefault()

					onCreate()
				}}
				className="flex h-full flex-col space-y-2.5"
			>
				<div className="flex h-full flex-col space-y-2.5 overflow-y-auto">
					<Card className="flex flex-col space-y-2 px-6 py-5 shadow-sm">
						<Label>Link class</Label>

						{linkedCourse ? (
							<div className="relative">
								<AttachmentItem
									name={linkedCourse.name}
									subname={linkedCourse.section}
									url={linkedCourse.url}
								/>

								<button
									type="button"
									onClick={onUnlink}
									className="group absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-[0.75px] border-border bg-surface-selected transition-all duration-150 hover:bg-surface-selected-hover"
								>
									<X
										size={14}
										className="text-black opacity-40 transition-all duration-150 group-hover:opacity-60"
									/>
								</button>
							</div>
						) : (
							<Button
								onClick={(e) => {
									e.preventDefault()

									onLink()
								}}
								id="link-class"
								size="large"
							>
								Link with Google Classroom class
							</Button>
						)}
					</Card>

					<Card className="space-y-2 px-6 py-5 shadow-sm">
						<Label>Name</Label>

						<TextInput
							value={nameInput}
							setValue={setNameInput}
							placeholder="Class name"
							id="name"
							autoFocus
							autoComplete="off"
							className="py-2.5 pl-4 text-base"
						/>

						<Label>Section</Label>

						<TextInput
							value={sectionInput}
							setValue={setSectionInput}
							placeholder="Section (optional)"
							id="section"
							autoComplete="off"
							className="py-2.5 pl-4 text-base"
						/>
					</Card>

					<Card className="flex-1 space-y-2 px-6 py-5 shadow-sm">
						<Label>Students</Label>

						<InputList
							values={studentEmailInputs}
							setValues={setStudentEmailInputs}
							singleWord
							placeholder="Student email"
							id="students"
							className="h-min"
							textInputClassname="text-base w-[calc(33.333333%-27.333306px)]"
							buttonClassName="h-[46px] w-[46px]"
						/>

						<Label>Additional teachers</Label>

						<InputList
							values={additionalTeacherEmailInputs}
							setValues={setAdditionalTeacherEmailInputs}
							singleWord
							placeholder="Teacher email"
							id="additional-teachers"
							className="h-min"
							textInputClassname="text-base w-[calc(33.333333%-27.333306px)]"
							buttonClassName="h-[46px] w-[46px]"
						/>
					</Card>
				</div>

				<Card className="flex space-x-3 px-6 py-5 shadow-sm">
					<FancyButton
						size="large"
						type="submit"
						loading={creating}
						disabled={nameInput.length === 0}
					>
						Create
					</FancyButton>
				</Card>
			</form>

			<Modal
				title="We need extra permission to access your Google account"
				open={linkClassExplanationModalOpen}
				setOpen={setLinkClassExplanationModalOpen}
			>
				<div className="flex h-full flex-col justify-between">
					<div className="select-text text-lg leading-loose opacity-80">
						By linking this class with a class in Google Classroom,
						your Understand class will reflect the roster and all
						the assignments of your Google Classroom class.
						Additionally, we use the instructions on the assignments
						you create to provide your students with more tailored
						feedback on their work, and we&apos;ll use your Google
						Classroom class to automatically find instructions on
						assignments for you. However, in order to access your
						Google Classroom classes, we&apos;ll need to be granted
						extra permission to access your Google Account, and
						you&apos;ll need to reauthenticate with Google.
					</div>

					<FancyButton onClick={onReauthenticate} size="large">
						Reauthenticate
					</FancyButton>
				</div>
			</Modal>

			<FeatureBlockModal
				open={featureBlockModalOpen}
				setOpen={setFeatureBlockModalOpen}
				feature="create a linked course"
			/>

			<Modal
				title="Choose a class to import"
				open={linkClassModalOpen}
				setOpen={setLinkClassModalOpen}
			>
				{linkClassModalOpen && (
					<div className="flex h-full flex-col justify-between">
						<SelectList
							items={use(coursesPromise) ?? []}
							renderItem={({
								item: { id, name, section, url },
								selected,
							}) => (
								<AttachmentItem
									name={name}
									subname={section}
									url={url}
									photo={undefined}
									key={id}
									selected={selected}
								/>
							)}
							renderEmpty={() => (
								<Heading size="large">
									You&apos;re not teaching any classes in
									Google Classroom
								</Heading>
							)}
							selectionType="single"
							selectionSet={
								new Set(
									selectedCourseId ? [selectedCourseId] : []
								)
							}
							setSelectionSet={(updateSelectionSet) =>
								typeof updateSelectionSet === "function"
									? setSelectedCourseId(
											[
												...updateSelectionSet(
													new Set(
														selectedCourseId
															? [selectedCourseId]
															: []
													)
												),
											][0]
									  )
									: setSelectedCourseId(
											[...updateSelectionSet][0]
									  )
							}
						/>

						<Button
							onClick={onChooseClass}
							loading={courseLoading}
							disabled={selectedCourseId === undefined}
							size="large"
						>
							Import class
						</Button>
					</div>
				)}
			</Modal>
		</>
	)
}
