"use client"
import { useState } from "react"

import { type Assignment } from "~/data/Assignment"
import AssignmentSettingsModal from "./AssignmentSettingsModal"

interface Props {
	assignment: Assignment
}

export default function Instructions({ assignment }: Props) {
	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	return (
		<>
			<p
				onClick={() => setSettingsModalOpen(true)}
				className="cursor-pointer select-text whitespace-pre-line rounded-md border-[0.75px] border-border px-3 py-2 font-medium opacity-80 transition duration-150 hover:bg-surface-hover"
			>
				{assignment.instructions}
			</p>

			<AssignmentSettingsModal
				open={settingsModalOpen}
				setOpen={setSettingsModalOpen}
				assignment={assignment}
			/>
		</>
	)
}
