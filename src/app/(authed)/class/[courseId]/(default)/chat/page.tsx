import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import Card from "~/components/Card"
import Chat from "./Chat"
import Course from "~/data/Course"
import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"

export const metadata = {
	title: "Chat",
}

interface Params {
	courseId: string
}
//! fix keyboard usability and outlines
const ChatPage = async ({ params: { courseId } }: { params: Params }) => {
	const [course, role] = await Promise.all([
		Course({ id: courseId }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (course === undefined || role === "none") notFound()

	return (
		<Card className="flex flex-1 flex-col py-5 px-6">
			<Chat courseId={courseId} courseName={course.name} role={role} />
		</Card>
	)
}

export default ChatPage
