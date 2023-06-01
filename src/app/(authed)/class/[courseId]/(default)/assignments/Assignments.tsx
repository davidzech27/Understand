"use client"
import Link from "next/link"

import FormattedDate from "~/utils/FormattedDate"
import Row from "~/components/Row"

interface Props {
	courseId: string
	role: "teacher" | "student"
	assignments: {
		courseId: string
		assignmentId: string
		title: string
		description: string | undefined
		instructions: string | undefined
		context: string | undefined
		dueAt: Date | undefined
		linkedUrl: string | undefined
	}[]
}

const Assignments: React.FC<Props> = ({ courseId, role, assignments }) => {
	return (
		<Row.List
			items={assignments}
			renderEmptyState={
				<>
					<span className="ml-1 font-medium leading-relaxed opacity-60">
						{`This is where you'll see ${
							role === "teacher"
								? "your created assignments"
								: "assigned assignments"
						}`}
					</span>

					{role === "teacher" && (
						<span className="ml-1 mt-1 leading-relaxed opacity-60">
							Use the plus button in the upper right corner to
							create some
						</span>
					)}
				</>
			}
		>
			{({ item: assignment }) => (
				<Row.Item key={assignment.assignmentId}>
					<Link
						href={`/class/${courseId}/${
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

export default Assignments
