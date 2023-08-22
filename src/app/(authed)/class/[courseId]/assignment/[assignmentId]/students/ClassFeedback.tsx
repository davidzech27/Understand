"use client"

import UnorderedList from "~/components/UnorderedList"
import UserItem from "~/components/UserItem"

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

export default function ClassFeedback({
	courseId,
	assignmentId,
	students,
}: Props) {
	return (
		<UnorderedList
			items={students}
			renderItem={({ email, name, photo, feedback }) => {
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
							note="Not yet received feedback"
							disabled
							key={email}
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
