"use client"
import Link from "next/link"

import Row from "~/components/Row"
import FormattedDate from "~/utils/FormattedDate"

interface Props {
	assignments: {
		courseId: string
		assignmentId: string
		title: string
		dueAt: Date
	}[]
	role: "teacher" | "student"
}

const UpcomingAssignments: React.FC<Props> = ({ assignments, role }) => {
	return (
		<Row.List
			items={assignments}
			renderEmptyState={
				role === "teacher" ? (
					<span className="opacity-60">
						This is where you&apos;ll see the upcoming assignments
						for all the classes you&apos;re teaching
					</span>
				) : (
					<span className="opacity-60">
						This is where you&apos;ll see the upcoming assignments
						for all the classes you&apos;re in
					</span>
				)
			}
		>
			{({ item: assignment }) => (
				<Row.Item key={assignment.assignmentId}>
					<Link
						href={`/class/${assignment.courseId}/${
							role === "teacher" ? "assignment" : "feedback"
						}/${assignment.assignmentId}`}
						className="flex h-20 items-center justify-between"
					>
						<span className="text-lg font-medium opacity-90">
							{assignment.title}
						</span>

						<span className="opacity-60">
							{assignment.dueAt ? (
								<FormattedDate
									prefix="Due "
									date={assignment.dueAt}
								/>
							) : (
								"No due date"
							)}
						</span>
					</Link>
				</Row.Item>
			)}
		</Row.List>
	)
}

export default UpcomingAssignments
