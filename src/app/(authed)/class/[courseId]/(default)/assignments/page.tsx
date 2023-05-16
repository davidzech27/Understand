import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
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

	return (
		<Assignments
			courseId={courseId}
			role={role}
			assignments={assignments}
		/>
	)
}

export default AssignmentsPage
