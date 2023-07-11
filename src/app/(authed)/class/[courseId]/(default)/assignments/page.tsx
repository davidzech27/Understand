import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Card from "~/components/Card"
import Course from "~/data/Course"
import User from "~/data/User"
import SectionList from "~/components/SectionList"
import Heading from "~/components/Heading"
import AssignmentItem from "~/components/AssignmentItem"

export const metadata = {
	title: "Assignments",
}

export const runtime = "edge"

interface Params {
	courseId: string
}

const AssignmentsPage = async ({
	params: { courseId },
}: {
	params: Params
}) => {
	const [assignments, role] = await Promise.all([
		Course({ id: courseId }).assignments(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (role === "none") notFound()

	const assignmentsWithInstructions = assignments.filter(
		(assignment) => assignment.instructions !== undefined
	)

	const assignmentsWithoutInstructions = assignments.filter(
		(assignment) => assignment.instructions === undefined
	)

	return (
		<Card className="flex-1 px-6 py-5">
			<SectionList
				sections={[
					...(assignmentsWithoutInstructions.length === 0
						? []
						: [
								{
									heading: "Assignments missing instructions",
									items: assignmentsWithoutInstructions,
									renderItem: ({
										item: { assignmentId, title, dueAt },
									}: {
										item: {
											assignmentId: string
											title: string
											dueAt: Date | undefined
										}
									}) => (
										<AssignmentItem
											title={title}
											dueAt={dueAt}
											href={`/class/${courseId}/${
												role === "teacher"
													? "assignment"
													: "feedback"
											}/${assignmentId}`}
											key={assignmentId}
										/>
									),
								},
						  ]),
					{
						heading: "Assignments",
						items: assignmentsWithInstructions,
						renderItem: ({
							item: { assignmentId, title, dueAt },
						}) => (
							<AssignmentItem
								title={title}
								dueAt={dueAt}
								href={`/class/${courseId}/${
									role === "teacher"
										? "assignment"
										: "feedback"
								}/${assignmentId}`}
								key={assignmentId}
							/>
						),
						renderEmpty: () => (
							<>
								<Heading
									size="large"
									className="ml-1 leading-relaxed"
								>
									{`This is where you'll see ${
										role === "teacher"
											? "your created assignments"
											: "assigned assignments"
									}`}
								</Heading>

								{role === "teacher" && (
									<Heading
										size="medium"
										className="ml-1 mt-1 leading-relaxed opacity-60"
									>
										Use the plus button in the upper right
										corner to create some
									</Heading>
								)}
							</>
						),
					},
				]}
				headingSize="large"
			/>
		</Card>
	)
}

export default AssignmentsPage
