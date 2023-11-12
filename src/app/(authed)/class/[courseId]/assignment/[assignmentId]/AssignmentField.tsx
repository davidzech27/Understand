"use client"
import React, { useState } from "react"

import { type Assignment } from "~/data/Assignment"
import cn from "~/utils/cn"
import AssignmentSettingsModal from "./AssignmentSettingsModal"

interface Props extends React.PropsWithChildren {
	assignment: Assignment
	className?: string
}

export default function AssignmentField({
	assignment,
	children,
	className,
}: Props) {
	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	return (
		<>
			<p
				onClick={() => setSettingsModalOpen(true)}
				className={cn(
					"cursor-pointer select-text whitespace-pre-line rounded-md border-[0.75px] border-border px-3 py-2 font-medium opacity-80 transition duration-150 hover:bg-surface-hover",
					className,
				)}
			>
				{children}
			</p>

			<AssignmentSettingsModal
				open={settingsModalOpen}
				setOpen={setSettingsModalOpen}
				assignment={assignment}
			/>
		</>
	)
}
