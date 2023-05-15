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
import Modal from "~/components/Modal"
import updateCourseAction from "./updateCourseAction"
import deleteCourseAction from "./deleteCourseAction"

interface Props {
	course: { id: string; name: string; section?: string }
	role: "teacher" | "student"
}

const SegmentTabs: React.FC<Props> = ({ course, role }) => {
	const segment = useSelectedLayoutSegment()

	const router = useRouter()

	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	const [classNameInput, setClassNameInput] = useState(course.name)
	const [classSectionInput, setClassSectionInput] = useState(
		course.section ?? ""
	)

	const updateDisabled =
		(classNameInput === course.name &&
			classSectionInput === course.section) ||
		classNameInput.trim().length === 0

	const [confirmingDeleteClass, setConfirmingDeleteClass] = useState(false)

	const { mutate: updateCourse, isLoading: isUpdatingCourse } =
		useZact(updateCourseAction)

	const onUpdateCourse = async () => {
		if (updateDisabled) return

		await updateCourse({
			id: course.id,
			name: classNameInput.trim(),
			section: classSectionInput.trim(),
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
					className="flex h-full flex-col justify-between"
				>
					<div className="flex flex-col space-y-2">
						<div className="ml-1 font-medium opacity-80">Name</div>

						<TextInput
							value={classNameInput}
							setValue={setClassNameInput}
							placeholder="Class name"
							className="py-2.5 pl-4 text-base"
						/>

						<div className="ml-1 font-medium opacity-80">
							Section
						</div>

						<TextInput
							value={classSectionInput ?? ""}
							setValue={setClassSectionInput}
							placeholder="Class section"
							className="py-2.5 pl-4 text-base"
						/>

						<div className="flex space-x-3 pt-3">
							{!confirmingDeleteClass ? (
								<Button
									onClick={() =>
										setConfirmingDeleteClass(true)
									}
									type="button"
									className="text-lg"
								>
									Delete class
								</Button>
							) : (
								<>
									<Button
										onClick={onDeleteCourse}
										type="button"
										loading={isDeletingCourse}
										className="text-lg"
									>
										Do you really want to delete this class?
									</Button>

									<Button
										onClick={() =>
											setConfirmingDeleteClass(false)
										}
										type="button"
										className="text-lg"
									>
										Actually, never mind
									</Button>
								</>
							)}
						</div>
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

export default SegmentTabs
