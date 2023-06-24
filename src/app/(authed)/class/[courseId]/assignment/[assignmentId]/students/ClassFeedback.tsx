"use client"
import Link from "next/link"

import Row from "~/components/Row"
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
		<Row.List
			items={students}
			renderEmptyState={
				<span className="text-lg opacity-60">No students in class</span>
			}
		>
			{({ item: { email, name, photo, feedback } }) => {
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
						<Row.Item key={email}>
							<Link
								href={`/class/${courseId}/insights/${assignmentId}/${email}`}
								className="flex h-20 items-center justify-between"
							>
								{inner}
							</Link>
						</Row.Item>
					)
				} else {
					return (
						<Row.Item key={email} disabled>
							<div className="flex h-20 items-center justify-between">
								{inner}
							</div>
						</Row.Item>
					)
				}
			}}
		</Row.List>
	)
}

export default ClassFeedback
