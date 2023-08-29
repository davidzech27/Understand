"use client"
import { useState } from "react"
import { Settings2 } from "lucide-react"

import LinkButton from "~/components/LinkButton"
import ClassSettingsModal from "./ClassSettingsModal"

interface Props {
	course: { id: string; name: string; section?: string; linkedUrl?: string }
	teacherEmailsPromise: Promise<string[]>
	studentEmailsPromise: Promise<string[]>
	role: "teacher" | "student"
}

export default function ClassTab({
	course,
	teacherEmailsPromise,
	studentEmailsPromise,
	role,
}: Props) {
	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	return (
		<div className="flex items-center justify-between">
			<div className="flex space-x-1.5">
				<LinkButton href={`/class/${course.id}`}>Home</LinkButton>

				<LinkButton href={`/class/${course.id}/assignments`}>
					Assignments
				</LinkButton>

				<LinkButton href={`/class/${course.id}/people`}>
					People
				</LinkButton>

				<LinkButton href={`/class/${course.id}/chat`}>Chat</LinkButton>
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

			<ClassSettingsModal
				open={settingsModalOpen}
				setOpen={setSettingsModalOpen}
				course={course}
				teacherEmailsPromise={teacherEmailsPromise}
				studentEmailsPromise={studentEmailsPromise}
			/>
		</div>
	)
}
