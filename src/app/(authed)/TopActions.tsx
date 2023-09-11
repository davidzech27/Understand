"use client"
import { useState } from "react"
import Link from "next/link"
import { Plus, ChevronDown, FilePlus2, UserPlus } from "lucide-react"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { usePathname, useRouter } from "next/navigation"

import joinCourseAction from "./joinCourseAction"
import Modal from "~/components/Modal"
import TextInput from "~/components/TextInput"
import Heading from "~/components/Heading"
import FancyButton from "~/components/FancyButton"

interface Props {
	schoolRole: "teacher" | "student" | undefined
}

export default function TopActions({ schoolRole }: Props) {
	const pathname = usePathname()

	const router = useRouter()

	const [joinClassModalOpen, setJoinClassModalOpen] = useState(false)

	const [inviteCodeInput, setInviteCodeInput] = useState("")

	const [joining, setJoining] = useState(false)

	const onJoinClass = async () => {
		setJoining(true)

		const { courseId } = await joinCourseAction({
			inviteCode: inviteCodeInput,
		})

		// maybe show user message
		if (courseId === undefined) {
			setJoining(false)
		} else {
			router.refresh()

			router.push(`/class/${courseId}`)

			setJoining(false)

			setJoinClassModalOpen(false)
		}
	}

	return (
		<NavigationMenu.Root delayDuration={0} className="relative">
			<NavigationMenu.List>
				<NavigationMenu.Item>
					<NavigationMenu.Trigger
						// not optimal
						id="radix-:Rcmqcq:-trigger-radix-:R3cmqcq:"
						aria-controls="radix-:Rcmqcq:-content-radix-:R3cmqcq:"
						className="flex h-8 items-center space-x-[1px] rounded-md bg-background-raised px-2 transition-all duration-150 hover:bg-background-raised-hover"
					>
						<Plus size={20} className="opacity-80" />

						<ChevronDown
							size={20}
							className="relative top-[1px] opacity-60"
						/>
					</NavigationMenu.Trigger>

					<NavigationMenu.Content className="flex flex-col space-y-1.5 p-3">
						{schoolRole !== "student" && (
							<>
								<NavigationMenu.Link
									asChild
									active={pathname === "/assignment/create"}
								>
									<Link
										href="/assignment/create"
										className="relative flex h-14 w-60 cursor-pointer items-center rounded-md border-[0.75px] border-primary bg-primary/5 outline-none transition-all duration-150 focus-within:bg-primary/10 hover:bg-primary/10 data-[active]:bg-primary/10"
									>
										<FilePlus2
											size={18}
											className="ml-6 text-primary opacity-80"
										/>

										<div className="ml-5 font-medium opacity-70">
											Create assignment
										</div>
									</Link>
								</NavigationMenu.Link>

								<NavigationMenu.Link
									asChild
									active={pathname === "/class/create"}
								>
									<Link
										href="/class/create"
										className="relative flex h-14 w-60 cursor-pointer items-center rounded-md border-[0.75px] border-secondary bg-secondary/5 outline-none transition-all duration-150 hover:bg-secondary/10 focus-visible:bg-secondary/10 data-[active]:bg-secondary/10"
									>
										<UserPlus
											size={18}
											className="ml-6 text-secondary opacity-80"
										/>

										<div className="ml-5 font-medium opacity-70">
											Create class
										</div>
									</Link>
								</NavigationMenu.Link>
							</>
						)}

						{schoolRole !== "teacher" && (
							<>
								<button
									onClick={() => setJoinClassModalOpen(true)}
									className="relative flex h-14 w-60 cursor-pointer items-center rounded-md border-[0.75px] border-primary bg-primary/5 outline-none transition-all duration-150 focus-within:bg-primary/10 hover:bg-primary/10 data-[active]:bg-primary/10"
								>
									<UserPlus
										size={18}
										className="ml-6 text-primary opacity-80"
									/>

									<div className="ml-5 font-medium opacity-70">
										Join class
									</div>
								</button>

								<Modal
									open={joinClassModalOpen}
									setOpen={setJoinClassModalOpen}
									title="Join class"
								>
									<div className="flex h-full flex-col justify-between">
										<div className="space-y-2">
											<Heading
												size="medium"
												className="ml-1"
											>
												Invite code
											</Heading>

											<TextInput
												value={inviteCodeInput}
												setValue={setInviteCodeInput}
												placeholder="Invite code"
											/>
										</div>

										<FancyButton
											onClick={onJoinClass}
											size="large"
											disabled={inviteCodeInput === ""}
											loading={joining}
										>
											Join class
										</FancyButton>
									</div>
								</Modal>
							</>
						)}
					</NavigationMenu.Content>
				</NavigationMenu.Item>
			</NavigationMenu.List>

			<div className="absolute right-0 top-[calc(100%+6px)] z-50">
				{/* can't get exit animation to work yet */}
				<NavigationMenu.Viewport className="animate-[scale-in] rounded-md border-[0.75px] border-border bg-surface shadow-lg shadow-[#00000016] transition-all duration-150" />
			</div>
		</NavigationMenu.Root>
	)
}
