"use client"
import * as Form from "@radix-ui/react-form"
import { use, useState } from "react"
import { useZact } from "zact/client"
import { X } from "lucide-react"

import TextInput from "~/components/TextInput"
import Card from "~/components/Card"
import ListInput from "~/components/ListInput"
import Button from "~/components/Button"
import FancyButton from "~/components/FancyButton"
import Modal from "~/components/Modal"
import Avatar from "~/components/Avatar"
import getAuthenticationURL from "~/google/getAuthenticationURL"
import Row from "~/components/Row"
import createCourseAction from "./createCourseAction"
import { useRouter } from "next/navigation"

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
}

const CreateClassForm: React.FC<Props> = ({ coursesPromise }) => {
	const router = useRouter()

	const { mutate: createCourse, isLoading: isCreatingCourse } =
		useZact(createCourseAction)

	const onCreate = async () => {
		const id =
			linkedCourse?.id ??
			new Date().valueOf().toString() +
				Math.floor(Math.random() * 1_000_000).toString() // milliseconds after epoch appended by 6 random digits

		await createCourse({
			id,
			name: nameInput.trim(),
			section: sectionInput.trim() || undefined,
			linkedUrl: linkedCourse?.url,
			additionalTeacherEmails: additionalTeacherEmailInputs,
			studentEmails: studentEmailInputs,
		})

		router.refresh()

		router.push(`/class/${id}`)
	}

	const onLink = async () => {
		const courses = await coursesPromise

		if (courses === undefined) {
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
				"https://www.googleapis.com/auth/classroom.profile.photos",
				"https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
				"https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
				"https://www.googleapis.com/auth/drive.readonly",
				"https://www.googleapis.com/auth/classroom.push-notifications",
			],
			redirectTo: "/class/create",
		})
	}

	const [linkClassModalOpen, setLinkClassModalOpen] = useState(false)

	const [linkClassExplanationModalOpen, setLinkClassExplanationModalOpen] =
		useState(false)

	const [selectedCourseId, setSelectedCourseId] = useState<string>() // perhaps extract behavior to separate component

	const [courseLoading, setCourseLoading] = useState(false)

	const [linkedCourse, setLinkedCourse] = useState<{
		id: string
		name: string
		section?: string
		url: string
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

		setAdditionalTeacherEmailInputs(
			roster.teachers.map((teacher) => teacher.email).filter(Boolean)
		)

		setStudentEmailInputs(roster.students.map((student) => student.email))

		setLinkedCourse(course)

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
	const [studentEmailInputs, setStudentEmailInputs] = useState<string[]>([""])
	const [additionalTeacherEmailInputs, setAdditionalTeacherEmailInputs] =
		useState<string[]>([""])

	return (
		<>
			<Form.Root
				onSubmit={(e) => {
					e.preventDefault()

					onCreate()
				}}
				className="flex h-full flex-col space-y-2.5"
			>
				<Card className="flex flex-col space-y-2 py-5 px-6 shadow-sm">
					<div className="ml-1 font-medium opacity-80">
						Link class
					</div>

					{linkedCourse ? (
						<div className="relative flex h-20 w-full items-center space-x-3 rounded-md border-[0.75px] border-border px-6">
							<Avatar
								src={undefined}
								name={linkedCourse.name}
								fallbackColor="secondary"
								className="h-12 w-12"
							/>

							<div className="flex flex-1 flex-col">
								<div className="flex w-full justify-between">
									<span className="font-medium opacity-80">
										{linkedCourse.name}
									</span>

									<span className="relative top-[2px] text-sm opacity-60">
										{linkedCourse.section}
									</span>
								</div>

								<a
									href={linkedCourse.url}
									className="text-sm opacity-60 hover:underline"
								>
									{linkedCourse.url}
								</a>
							</div>

							<button
								type="button"
								onClick={onUnlink}
								className="group absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-[0.75px] border-border bg-surface-selected transition-all duration-150 hover:bg-surface-selected-hover"
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
							className="h-20 w-full text-3xl"
						>
							Link with Google Classroom class
						</Button>
					)}
				</Card>

				<Card className="space-y-2 px-6 py-5 shadow-sm">
					<div className="ml-1 font-medium opacity-80">Name</div>

					<Form.Field asChild name="class-name">
						<Form.Control asChild>
							<TextInput
								value={nameInput}
								setValue={setNameInput}
								placeholder="Class name"
								autoFocus
								className="h-min py-2.5 pl-4 text-base"
							/>
						</Form.Control>
					</Form.Field>

					<div className="ml-1 font-medium opacity-80">Section</div>

					<Form.Field asChild name="class-section">
						<Form.Control asChild>
							<TextInput
								value={sectionInput}
								setValue={setSectionInput}
								placeholder="Section (optional)"
								className="h-min py-2.5 pl-4 text-base"
							/>
						</Form.Control>
					</Form.Field>
				</Card>

				<Card className="flex-1 space-y-2 overflow-y-scroll px-6 py-5 shadow-sm">
					<div className="ml-1 font-medium opacity-80">Students</div>

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
						Additional teachers
					</div>

					<ListInput
						values={additionalTeacherEmailInputs}
						setValues={setAdditionalTeacherEmailInputs}
						singleWord
						placeholder="Teacher email"
						className="h-min"
						textInputClassname="py-2.5 pl-4 text-base w-[calc(33.333333%-27.333306px)] h-min"
						buttonClassName="h-[46px] w-[46px]"
					/>
				</Card>

				<Card className="flex space-x-3 py-5 px-6 shadow-sm">
					<Form.Submit asChild>
						<FancyButton
							loading={isCreatingCourse}
							disabled={nameInput.length === 0}
							className="h-20 text-3xl"
						>
							Create
						</FancyButton>
					</Form.Submit>
				</Card>
			</Form.Root>

			<Modal
				title="We need extra permission to access your Google account"
				open={linkClassExplanationModalOpen}
				setOpen={setLinkClassExplanationModalOpen}
			>
				<div className="flex h-full flex-col justify-between">
					<div className="select-text text-lg leading-loose opacity-80">
						By linking this class with a class in Google Classroom,
						this class will reflect the roster and all the
						assignments of that class. Additionally, we use the
						instructions on the assignments you create to provide
						your students with more tailored feedback on their work,
						and we&apos;ll use your Google Classroom class to
						automatically find instructions on assignments for you.
						However, we are occasionally unable to find instructions
						on assignments on Google Classroom, so there is a slight
						chance that not all instructions on assignments will be
						imported properly. But ultimately, this should not be
						detrimental, and this feature should make using this
						platform much more convenvient for you. However, in
						order to access your class in Google Classroom,
						we&apos;ll need to be granted extra permission to access
						your Google Account, and you&apos;ll need to
						reauthenticate with Google.
					</div>

					<FancyButton
						onClick={onReauthenticate}
						className="h-20 text-3xl"
					>
						Reauthenticate
					</FancyButton>
				</div>
			</Modal>

			<Modal
				title="Choose a class to import"
				open={linkClassModalOpen}
				setOpen={setLinkClassModalOpen}
			>
				{linkClassModalOpen && (
					<div className="flex h-full flex-col justify-between">
						<Row.List items={use(coursesPromise) ?? []}>
							{({ item: { id, name, section } }) => (
								<Row.Item
									key={id}
									selected={id === selectedCourseId}
									onAction={() => setSelectedCourseId(id)}
									onKeyboardFocus={() =>
										setSelectedCourseId(id)
									}
								>
									<div className="flex h-20 cursor-pointer items-center">
										<Avatar
											src={undefined}
											name={name}
											fallbackColor="secondary"
											className="h-12 w-12"
										/>

										<div className="ml-3 flex flex-shrink flex-col">
											<span className="mb-[1px] font-medium leading-none opacity-90">
												{name}
											</span>

											<span className="text-sm opacity-60">
												{section}
											</span>
										</div>
									</div>
								</Row.Item>
							)}
						</Row.List>

						<Button
							onClick={onChooseClass}
							loading={courseLoading}
							disabled={selectedCourseId === undefined}
							className="h-20 text-3xl"
						>
							Import class
						</Button>
					</div>
				)}
			</Modal>
		</>
	)
}

export default CreateClassForm
