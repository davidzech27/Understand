"use client"
import Link from "next/link"

import UnorderedList from "~/components/UnorderedList"
import UserItem from "~/components/UserItem"
import Avatar from "~/components/Avatar"

interface Props {
	courseId: string
	assignmentId: string
	students: {
		email: string
		name: string
		photo?: string
		feedback: boolean
	}[]
}

const ClassFeedback: React.FC<Props> = ({
	courseId,
	assignmentId,
	students,
}) => {
	return (
		<UnorderedList
			items={students}
			renderItem={({ email, name, photo, feedback }) => {
				const inner = (
					<>
						<div className="flex items-center">
							<Avatar
								src={photo}
								name={name ?? email}
								fallbackColor="primary"
								className="h-11 w-11 rounded-full"
							/>

							<div className="ml-3 flex flex-col">
								<span className="mb-[1px] font-medium leading-none opacity-90">
									{name}
								</span>

								<span className="text-sm opacity-60">
									{email}
								</span>
							</div>
						</div>

						{!feedback && (
							<span className="italic opacity-60">
								Hasn&apos;t received feedback
							</span>
						)}
					</>
				)

				if (feedback) {
					return (
						<UserItem
							email={email}
							name={name}
							href={`/class/${courseId}/insights/${assignmentId}/${email}`}
							photo={photo}
							key={email}
						/>
					)
				} else {
					return (
						<UserItem
							email={email}
							name={name}
							photo={photo}
							key={email}
							disabled
						/>
					)
				}
			}}
			renderEmpty={() => (
				<span className="text-lg opacity-60">No students in class</span>
			)}
		/>
	)
}

export default ClassFeedback
