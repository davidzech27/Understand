"use client"
import * as Form from "@radix-ui/react-form"
import * as Select from "@radix-ui/react-select"
import { ChevronDown } from "lucide-react"
import { use, useState } from "react"
import { useZact } from "zact/client"

import TextInput from "~/components/TextInput"
import Card from "~/components/Card"
import FancyButton from "~/components/FancyButton"
import Avatar from "~/components/Avatar"
import createAssignmentAction from "./createAssignmentAction"
import { useRouter } from "next/navigation"
import TextArea from "~/components/TextArea"

interface Props {
	coursesTeachingPromise: Promise<
		{
			name: string
			id: string
			section?: string
		}[]
	>
}

const CreateAssignmentForm: React.FC<Props> = ({ coursesTeachingPromise }) => {
	const router = useRouter()

	const { mutate: createAssignment, isLoading: isCreatingAssignment } =
		useZact(createAssignmentAction)

	const onCreate = async () => {
		if (courseId === undefined) return

		const id =
			new Date().valueOf().toString() +
			Math.floor(Math.random() * 1_000_000).toString() // milliseconds after epoch appended by 6 random digits

		await createAssignment({
			courseId,
			assignmentId: id,
			title: titleInput.trim(),
			instructions: instructionsInput.trim(),
			description: descriptionInput.trim() || undefined,
		})

		router.refresh()

		router.push(`/class/${courseId}/assignment/${id}`)
	}

	const [titleInput, setTitleInput] = useState("")
	const [descriptionInput, setDescriptionInput] = useState("")
	const [courseId, setCourseId] = useState<string>()
	const [instructionsInput, setInstructionsInput] = useState("")

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
					<div className="ml-1 font-medium opacity-80">Title</div>

					<Form.Field asChild name="assignment-title">
						<Form.Control asChild>
							<TextInput
								value={titleInput}
								setValue={setTitleInput}
								placeholder="Assignment title"
								autoFocus
								className="h-min py-2.5 pl-4 text-base"
							/>
						</Form.Control>
					</Form.Field>

					<div className="ml-1 font-medium opacity-80">
						Description
					</div>

					<Form.Field asChild name="assignment-student-description">
						<Form.Control asChild>
							<TextInput
								value={descriptionInput}
								setValue={setDescriptionInput}
								placeholder="Assignment description (optional)"
								className="h-min py-2.5 pl-4 text-base"
							/>
						</Form.Control>
					</Form.Field>
				</Card>

				<Card className="space-y-2 px-6 py-5 shadow-sm">
					<div className="ml-1 font-medium opacity-80">Class</div>

					<Form.Field asChild name="assignment-course-id">
						<Form.Control asChild>
							<Select.Root
								value={courseId}
								onValueChange={setCourseId}
							>
								<Select.Trigger className="flex w-full cursor-pointer justify-between rounded-md border-[0.75px] border-border py-2.5 px-4 outline-none transition-all duration-150 data-[state=open]:bg-white">
									<Select.Value aria-label={courseId} asChild>
										<span className="font-medium opacity-80">
											{(
												use(coursesTeachingPromise) ??
												[]
											).find(
												(course) =>
													course.id === courseId
											)?.name ?? "No course selected"}
										</span>
									</Select.Value>

									<Select.Icon asChild>
										<ChevronDown
											size={24}
											className="relative top-[2px] text-black opacity-80"
										/>
									</Select.Icon>
								</Select.Trigger>

								<Select.Portal>
									<Select.Content
										position="popper"
										sideOffset={4}
									>
										<Select.Viewport className="w-full rounded-md border-[0.75px] border-border bg-white">
											{(
												use(coursesTeachingPromise) ??
												[]
											).map((course) => (
												<Select.Item
													value={course.id}
													key={course.id}
													className="flex cursor-pointer items-center space-x-2 bg-surface px-4 py-3 font-medium opacity-80 outline-none transition-all duration-150 hover:bg-surface-hover data-[state=checked]:bg-surface-selected data-[state=checked]:hover:bg-surface-selected-hover"
												>
													<Avatar
														src={undefined}
														name={course.name}
														fallbackColor="secondary"
														className="h-7 w-7"
													/>

													<Select.ItemText>
														{course.name}
													</Select.ItemText>
												</Select.Item>
											))}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</Form.Control>
					</Form.Field>
				</Card>

				<Card className="flex-1 space-y-2 overflow-y-scroll px-6 py-5 shadow-sm">
					<div className="ml-1 font-medium opacity-80">
						Instructions
					</div>

					<Form.Field asChild name="assignment-student-description">
						<Form.Control asChild>
							<TextArea
								value={instructionsInput}
								setValue={setInstructionsInput}
								placeholder="Instructions for feedback"
								className="h-full py-2.5 pl-4 text-base"
							/>
						</Form.Control>
					</Form.Field>
				</Card>

				<Card className="flex py-5 px-6 shadow-sm">
					<Form.Submit asChild>
						<FancyButton
							loading={isCreatingAssignment}
							disabled={
								titleInput.length === 0 ||
								instructionsInput.length === 0 ||
								courseId === undefined
							}
							className="h-20 text-3xl"
						>
							Create
						</FancyButton>
					</Form.Submit>
				</Card>
			</Form.Root>
		</>
	)
}

export default CreateAssignmentForm
