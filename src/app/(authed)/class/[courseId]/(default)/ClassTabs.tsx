"use client"
import { useState } from "react"
import { Settings2 } from "lucide-react"

import LinkButton from "~/components/LinkButton"
import ClassSettingsModal from "./ClassSettingsModal"
import Button from "~/components/Button"
import Modal from "~/components/Modal"

interface Props {
	course: { id: string; name: string; section?: string; linkedUrl?: string }
	teacherEmailsPromise: Promise<string[]>
	studentEmailsPromise: Promise<string[]>
	role: "teacher" | "student"
	inviteCode: string | undefined
}

export default function ClassTab({
	course,
	teacherEmailsPromise,
	studentEmailsPromise,
	role,
	inviteCode,
}: Props) {
	const [settingsModalOpen, setSettingsModalOpen] = useState(false)

	const [inviteCodeModalOpen, setInviteCodeModalOpen] = useState(false)

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
				<div className="flex space-x-1.5">
					{inviteCode !== undefined && (
						<Button
							onClick={() => setInviteCodeModalOpen(true)}
							size="small"
						>
							Show student invite code
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
				</div>
			)}

			{inviteCode !== undefined && (
				<Modal
					open={inviteCodeModalOpen}
					setOpen={setInviteCodeModalOpen}
					title={"Student invite code"}
				>
					<div className="flex h-full items-center justify-center">
						<div className="select-text text-9xl font-extrabold tracking-tight text-black/80">
							{inviteCode}
						</div>
					</div>
				</Modal>
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
