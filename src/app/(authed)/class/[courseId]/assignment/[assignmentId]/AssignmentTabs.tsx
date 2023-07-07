"use client"
import { useState } from "react"
import { Settings2 } from "lucide-react"

import Button from "~/components/Button"
import SettingsModal from "./SettingsModal"
import LinkButton from "~/components/LinkButton"
import { env } from "~/env.mjs"

interface Props {
	role: "teacher" | "student"
	assignment: {
		courseId: string
		assignmentId: string
		title: string
		description?: string
		instructions?: string
		instructionsLinked: boolean
		context?: string
		dueAt?: Date
	}
}

const AssignmentTabs: React.FC<Props> = ({ role, assignment }) => {
	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	const [feedbackLinkCopied, setFeedbackLinkCopied] = useState(false)

	return (
		<div className="flex items-center space-x-1.5">
			<LinkButton
				href={`/class/${assignment.courseId}/assignment/${assignment.assignmentId}`}
			>
				Overview
			</LinkButton>

			<LinkButton
				href={`/class/${assignment.courseId}/assignment/${assignment.assignmentId}/students`}
			>
				Students
			</LinkButton>

			<LinkButton
				href={`/class/${assignment.courseId}/assignment/${assignment.assignmentId}/insights`}
			>
				Insights
			</LinkButton>

			<div className="flex-1" />

			{assignment.instructions !== undefined && (
				<Button
					onClick={() => {
						navigator.clipboard.writeText(
							`${window.location.protocol}//${window.location.host}/class/${assignment.courseId}/feedback/${assignment.assignmentId}`
						)

						setFeedbackLinkCopied(true)
					}}
					className="text-base"
				>
					{!feedbackLinkCopied
						? "Copy student feedback link"
						: "Student feedback link copied"}
				</Button>
			)}

			<div
				onClick={() => setSettingsModalOpen(true)}
				className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-all duration-150 hover:bg-surface-hover"
			>
				<Settings2
					size={20}
					className="opacity-80 transition-all duration-150 group-hover:opacity-60"
				/>
			</div>

			<SettingsModal
				open={settingsModalOpen}
				setOpen={setSettingsModalOpen}
				assignment={assignment}
			/>
		</div>
	)
}

export default AssignmentTabs
