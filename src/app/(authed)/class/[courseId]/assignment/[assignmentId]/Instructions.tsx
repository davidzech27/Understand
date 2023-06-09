"use client"
import { useState } from "react"

import SettingsModal from "./SettingsModal"

interface Props {
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

const Instructions: React.FC<Props> = ({ assignment }) => {
	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	return (
		<>
			<p
				onClick={() => setSettingsModalOpen(true)}
				className="cursor-pointer select-text whitespace-pre-line rounded-md border-[0.75px] border-border px-3 py-2 font-medium opacity-80 transition duration-150 hover:bg-surface-hover"
			>
				{assignment.instructions}
			</p>

			<SettingsModal
				open={settingsModalOpen}
				setOpen={setSettingsModalOpen}
				assignment={assignment}
			/>
		</>
	)
}

export default Instructions
