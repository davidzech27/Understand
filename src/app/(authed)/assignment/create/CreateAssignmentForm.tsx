"use client"
import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"

import createAssignmentAction from "./createAssignmentAction"
import cn from "~/utils/cn"
import Await from "~/utils/Await"
import * as DropDown from "~/components/DropDown"
import TextInput from "~/components/TextInput"
import Label from "~/components/Label"
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
			<form
				onSubmit={(e) => {
					e.preventDefault()

					onCreate()
				}}
				className="flex h-full flex-col space-y-2.5"
			>
				<div className="flex h-full flex-col space-y-2.5 overflow-y-auto">
					<Card className="space-y-2 px-6 py-5 shadow-sm">
						<Label>Title</Label>

						<TextInput
							value={titleInput}
							setValue={setTitleInput}
							placeholder="Assignment title"
							id="title"
							autoFocus
							autoComplete="off"
							className="py-2.5 pl-4 text-base"
						/>

						<Label>Description</Label>

						<TextArea
							value={descriptionInput}
							setValue={setDescriptionInput}
							placeholder="Assignment description (optional)"
							id="description"
							autoComplete="off"
							className="py-2.5 pl-4 text-base"
						/>
					</Card>

					<Card className="space-y-2 px-6 py-5 shadow-sm">
						<Label>Class</Label>

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
									<DropDown.Root
										value={courseId}
										setValue={setCourseId}
										items={coursesTeaching}
										getItemValue={({ id }) => id}
										renderItem={({ name }) => (
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
											coursesTeaching.length !== 0
												? coursesTeaching.find(
														(course) =>
															course.id ===
															courseId
												  )?.name ?? "No class selected"
												: "You're not teaching any classes!"
										}
										id="class"
									/>
								)}
							</Await>
						</Suspense>
					</Card>

					<Card className="flex-1 space-y-2 px-6 py-5 shadow-sm">
						<Label>Instructions</Label>

						<TextArea
							value={instructionsInput}
							setValue={setInstructionsInput}
							placeholder="Instructions for feedback"
							id="instructions"
							autoComplete="off"
							className={cn(
								"py-2.5 pl-4 text-base",
								instructionsInput === "" && "h-[46px]"
							)}
						/>
					</Card>
				</div>

				<Card className="flex px-6 py-5 shadow-sm">
					<FancyButton
						size="large"
						type="submit"
						loading={creating}
						disabled={
							titleInput.length === 0 ||
							instructionsInput.length === 0 ||
							courseId === undefined
						}
					>
						Create
					</FancyButton>
				</Card>
			</form>
		</>
	)
}
