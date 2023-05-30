import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Card from "~/components/Card"
import Course from "~/data/Course"
import User from "~/data/User"
import Assignments from "./Assignments"

export const metadata = {
	title: "Assignments",
}

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
		<Card className="flex flex-1 flex-col space-y-2 py-5 px-6">
			{assignmentsWithoutInstructions.length !== 0 &&
				role === "teacher" && (
					<>
						<div className="ml-1 text-lg font-medium opacity-60">
							Assignments missing instructions
						</div>

						<Assignments
							courseId={courseId}
							role={role}
							assignments={assignmentsWithoutInstructions}
						/>

						<div className="ml-1 text-lg font-medium opacity-60">
							Assignments
						</div>
					</>
				)}

			<Assignments
				courseId={courseId}
				role={role}
				assignments={assignmentsWithInstructions}
			/>
		</Card>
	)
}

export default AssignmentsPage
