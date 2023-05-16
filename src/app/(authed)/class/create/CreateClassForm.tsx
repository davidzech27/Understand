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
import useStickyState from "~/utils/useStickyState"
import Modal from "~/components/Modal"
import Avatar from "~/components/Avatar"
import authenticateWithGoogle from "~/google/authenticateWithGoogle"
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
		  }[]
		| undefined
	>
	courseRostersPromise: Promise<
		Record<string, { teachers: string[]; students: string[] }> | undefined
	>
}

const CreateClassForm: React.FC<Props> = ({
	coursesPromise,
	courseRostersPromise,
}) => {
	const router = useRouter()

	const { mutate: createCourse, isLoading: isCreatingCourse } =
		useZact(createCourseAction)

	const onCreate = async () => {
		const id =
			new Date().valueOf().toString() +
			Math.floor(Math.random() * 1_000_000).toString() // milliseconds after epoch appended by 6 random digits

		await createCourse({
			id,
			name: nameInput.trim(),
			section: sectionInput.trim() || undefined,
			additionalTeacherEmails: additionalTeacherEmailListInputs,
			studentEmails: studentEmailListInputs,
			googleClassroomId: importedCourse?.id,
		})

		router.refresh()

		router.push(`/class/${id}`)
	}

	const onImport = async () => {
		const courses = await coursesPromise

		if (courses === undefined) {
			authenticateWithGoogle({
				scopes: [
					"https://www.googleapis.com/auth/classroom.courses.readonly",
					"https://www.googleapis.com/auth/classroom.rosters.readonly",
					"https://www.googleapis.com/auth/userinfo.email",
					"https://www.googleapis.com/auth/userinfo.profile",
				],
				redirectTo: "/class/create",
			})
		} else {
			setImportClassModalOpen(true)
		}
	}

	const [importClassModalOpen, setImportClassModalOpen] = useState(false)

	const [selectedCourseId, setSelectedCourseId] = useState<string>() // perhaps extract behavior to separate component

	const [courseLoading, setCourseLoading] = useState(false)

	const [importedCourse, setImportedCourse] = useState<{
		id: string
		name: string
		section?: string
		url: string
	}>()

	const onChooseClass = async () => {
		setCourseLoading(true)

		const [courses, courseRosters] = await Promise.all([
			coursesPromise,
			courseRostersPromise,
		])

		setCourseLoading(false)

		if (!selectedCourseId || !courses || !courseRosters) return

		const course = courses.find((course) => course.id === selectedCourseId)

		const roster = courseRosters[selectedCourseId]

		if (!course || !roster) return

		setNameInput(course.name)

		course.section && setSectionInput(course.section)

		setAdditionalTeacherEmailListInputs(roster.teachers)

		setStudentEmailListInputs(roster.students)

		setImportedCourse(course)

		setImportClassModalOpen(false)

		setSelectedCourseId(undefined)
	}

	const onUnimport = () => {
		setNameInput("")
		setSectionInput("")
		setStudentEmailListInputs([""])
		setAdditionalTeacherEmailListInputs([""])

		setImportedCourse(undefined)
	}

	const [nameInput, setNameInput] = useState("")
	const [sectionInput, setSectionInput] = useState("")
	const [studentEmailListInputs, setStudentEmailListInputs] = useState<
		string[]
	>([""])
	const [
		additionalTeacherEmailListInputs,
		setAdditionalTeacherEmailListInputs,
	] = useState<string[]>([""])

	//! not sure why not working but should attempt to fix soon
	// const [classNameInput, setClassNameInput] = useStickyState(
	// 	"",
	// 	"class:create:classNameInput"
	// )
	// const [classSectionInput, setClassSectionInput] = useStickyState(
	// 	"",
	// 	"class:create:classSectionInput"
	// )
	// const [studentEmailListInputs, setStudentEmailListInputs] = useStickyState<
	// 	string[]
	// >([""], "class:create:studentEmailListInputs")
	// const [teacherEmailListInputs, setTeacherEmailListInputs] = useStickyState<
	// 	string[]
	// >([""], "class:create:teacherEmailListInputs")

	return (
		<>
			<Form.Root
				onSubmit={(e) => {
					e.preventDefault()

					onCreate()
				}}
				className="flex h-full flex-col space-y-2.5"
			>
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
						values={studentEmailListInputs}
						setValues={setStudentEmailListInputs}
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
						values={additionalTeacherEmailListInputs}
						setValues={setAdditionalTeacherEmailListInputs}
						singleWord
						placeholder="Teacher email"
						className="h-min"
						textInputClassname="py-2.5 pl-4 text-base w-[calc(33.333333%-27.333306px)] h-min"
						buttonClassName="h-[46px] w-[46px]"
					/>
				</Card>

				<Card className="flex space-x-3 py-5 px-6 shadow-sm">
					{importedCourse ? (
						<div className="relative flex h-20 w-1/2 items-center space-x-3 rounded-md border-[0.75px] border-border px-6">
							<Avatar
								src={undefined}
								name={importedCourse.name}
								fallbackColor="secondary"
								className="h-12 w-12"
							/>

							<div className="flex flex-1 flex-col space-y-0.5">
								<div className="flex w-full justify-between">
									<span className="text-sm opacity-80">
										{importedCourse.name}
									</span>

									<span className="relative top-[2px] text-xs opacity-60">
										{importedCourse.section}
									</span>
								</div>

								<a
									href={importedCourse.url}
									className="text-xs opacity-60 hover:underline"
								>
									{importedCourse.url}
								</a>
							</div>

							<button
								type="button"
								onClick={onUnimport}
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

								onImport()
							}}
							className="h-20 w-1/2 text-3xl"
						>
							Import class
						</Button>
					)}

					<Form.Submit asChild>
						<FancyButton
							loading={isCreatingCourse}
							disabled={nameInput.length === 0}
							className="h-20 w-1/2 text-3xl"
						>
							Create
						</FancyButton>
					</Form.Submit>
				</Card>
			</Form.Root>

			<Modal
				title="Choose a class to import"
				open={importClassModalOpen}
				setOpen={setImportClassModalOpen}
			>
				{importClassModalOpen && (
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
