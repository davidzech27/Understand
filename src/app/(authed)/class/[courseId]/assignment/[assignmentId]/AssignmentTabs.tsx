"use client"
import { useState } from "react"
import { Settings2 } from "lucide-react"

import { type Assignment } from "~/data/Assignment"
import Button from "~/components/Button"
import AssignmentSettingsModal from "./AssignmentSettingsModal"
import LinkButton from "~/components/LinkButton"

interface Props {
	assignment: Assignment
}

export default function AssignmentTabs({ assignment }: Props) {
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
					size="small"
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

			<AssignmentSettingsModal
				open={settingsModalOpen}
				setOpen={setSettingsModalOpen}
				assignment={assignment}
			/>
		</div>
	)
}
