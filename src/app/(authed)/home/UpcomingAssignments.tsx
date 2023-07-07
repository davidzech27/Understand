"use client"
import UnorderedList from "~/components/UnorderedList"
import AssignmentItem from "~/components/AssignmentItem"

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
		<UnorderedList
			items={assignments}
			renderItem={({ courseId, assignmentId, title, dueAt }) => (
				<AssignmentItem
					title={title}
					dueAt={dueAt}
					href={`/class/${courseId}/${
						role === "teacher" ? "assignment" : "feedback"
					}/${assignmentId}`}
					key={assignmentId}
				/>
			)}
			renderEmpty={() =>
				role === "teacher" ? (
					<span className="ml-1 opacity-60">
						This is where you&apos;ll see the upcoming assignments
						for all the classes you&apos;re teaching
					</span>
				) : (
					<span className="ml-1 opacity-60">
						This is where you&apos;ll see the upcoming assignments
						for all the classes you&apos;re in
					</span>
				)
			}
		/>
	)
}

export default UpcomingAssignments
