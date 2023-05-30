import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import Course from "~/data/Course"
import Card from "~/components/Card"
import Chat from "./Chat"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

interface Params {
	courseId: string
}

const ClassPage = async ({ params: { courseId } }: { params: Params }) => {
	const [course, role] = await Promise.all([
		Course({ id: courseId }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (course === undefined || role === "none") notFound()

	return (
		<Card className="flex flex-1 flex-col py-5 px-6">
			{course.linkedUrl !== undefined && (
				<Chat
					courseId={courseId}
					courseName={course.name}
					role={role}
				/>
			)}
		</Card>
	)
}

export default ClassPage
