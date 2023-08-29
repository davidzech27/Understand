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

export const runtime = "edge"

interface Params {
	courseId: string
}
//! fix keyboard usability and outlines
export default async function ChatPage({
	params: { courseId },
}: {
	params: Params
}) {
	const [course, courseHasResources, [user, role]] = await Promise.all([
		Course({ id: courseId }).get(),
		Course({ id: courseId }).hasResources(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			Promise.all([
				User({ email }).get(),
				User({ email }).courseRole({ id: courseId }),
			])
		),
	])

	if (course === undefined || user === undefined || role === "none")
		notFound()

	return (
		<Card className="flex flex-1 flex-col py-5 px-6">
			<Chat
				courseId={courseId}
				courseName={course.name}
				courseHasResources={courseHasResources}
				user={user}
				role={role}
			/>
		</Card>
	)
}
