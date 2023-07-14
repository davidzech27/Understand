"use client"
import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@radix-ui/react-form"
import * as Form from "@radix-ui/react-form"

import createAssignmentAction from "./createAssignmentAction"
import Await from "~/utils/Await"
import * as DropDown from "~/components/DropDown"
import TextInput from "~/components/TextInput"
import Heading from "~/components/Heading"
import Card from "~/components/Card"
import FancyButton from "~/components/FancyButton"
import Avatar from "~/components/Avatar"
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

export default function CreateAssignmentForm({
	coursesTeachingPromise,
}: Props) {
	const router = useRouter()

	const [creating, setCreating] = useState(false)

	const onCreate = async () => {
		if (courseId === undefined) return

		setCreating(true)

		const id =
			new Date().valueOf().toString() +
			Math.floor(Math.random() * 1_000_000).toString() // milliseconds after epoch appended by 6 random digits

		await createAssignmentAction({
			courseId,
			assignmentId: id,
			title: titleInput.trim(),
			instructions: instructionsInput.trim(),
			description: descriptionInput.trim() || undefined,
		})

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
					<Heading asChild size="medium" className="ml-1">
						<Label htmlFor="title">Title</Label>
					</Heading>

					<Form.Field asChild name="title">
						<Form.Control asChild>
							<TextInput
								value={titleInput}
								setValue={setTitleInput}
								placeholder="Assignment title"
								id="title"
								autoFocus
								autoComplete="off"
								className="h-min py-2.5 pl-4 text-base"
							/>
						</Form.Control>
					</Form.Field>

					<Heading asChild size="medium" className="ml-1">
						<Label htmlFor="description">Description</Label>
					</Heading>

					<Form.Field asChild name="description">
						<Form.Control asChild>
							<TextInput
								value={descriptionInput}
								setValue={setDescriptionInput}
								placeholder="Assignment description (optional)"
								id="description"
								autoComplete="off"
								className="h-min py-2.5 pl-4 text-base"
							/>
						</Form.Control>
					</Form.Field>
				</Card>

				<Card className="space-y-2 px-6 py-5 shadow-sm">
					<Heading asChild size="medium" className="ml-1">
						<Label htmlFor="class">Class</Label>
					</Heading>

					<Suspense
						fallback={
							<DropDown.Root
								displayValue="No class selected"
								value=""
								setValue={() => {}}
								getItemValue={() => ""}
								items={[]}
								renderItem={() => <></>}
							/>
						}
					>
						<Await promise={coursesTeachingPromise}>
							{(coursesTeaching) => (
								<Form.Field asChild name="class">
									<Form.Control asChild>
										<DropDown.Root
											value={courseId}
											setValue={setCourseId}
											items={coursesTeaching}
											getItemValue={({ id }) => id}
											renderItem={({
												id,
												name,
												section,
											}) => (
												<div className="flex items-center space-x-2 px-4 py-3 font-medium opacity-80">
													<Avatar
														src={undefined}
														name={name}
														fallbackColor="secondary"
														className="h-7 w-7"
													/>

													<DropDown.ItemText>
														{name}
													</DropDown.ItemText>
												</div>
											)}
											displayValue={
												coursesTeaching.find(
													(course) =>
														course.id === courseId
												)?.name ?? "No class selected"
											}
										/>
									</Form.Control>
								</Form.Field>
							)}
						</Await>
					</Suspense>
				</Card>

				<Card className="flex-1 space-y-2 overflow-y-scroll px-6 py-5 shadow-sm">
					<div className="ml-1 font-medium opacity-80">
						Instructions
					</div>
					<Heading asChild size="medium" className="ml-1">
						<Label htmlFor="instructions">Instructions</Label>
					</Heading>

					<Form.Field asChild name="description">
						<Form.Control asChild>
							<TextArea
								value={instructionsInput}
								setValue={setInstructionsInput}
								placeholder="Instructions for feedback"
								id="instructions"
								autoComplete="off"
								className="h-full py-2.5 pl-4 text-base"
							/>
						</Form.Control>
					</Form.Field>
				</Card>

				<Card className="flex py-5 px-6 shadow-sm">
					<Form.Submit asChild>
						<FancyButton
							size="large"
							loading={creating}
							disabled={
								titleInput.length === 0 ||
								instructionsInput.length === 0 ||
								courseId === undefined
							}
						>
							Create
						</FancyButton>
					</Form.Submit>
				</Card>
			</Form.Root>
		</>
	)
}
