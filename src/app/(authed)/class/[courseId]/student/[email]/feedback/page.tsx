import { notFound } from "next/navigation"

import Card from "~/components/Card"
import User from "~/data/User"
import Heading from "~/components/Heading"
import StudentFeedbackStream from "./StudentFeedbackStream"

export const runtime = "edge"

export const dynamic = "force-dynamic"

interface Params {
	courseId: string
	email: string
}

export const metadata = {
	title: "Feedback",
}

export default async function StudentFeedbackPage({
	params: { courseId, email },
}: {
	params: Params
}) {
	email = decodeURIComponent(email)

	const [{ feedbackStream, cursor }, user] = await Promise.all([
		User({ email }).feedbackStream({
			courseId,
			limit: 10,
		}),
		User({ email }).get(),
	])

	if (user === undefined) notFound()

	return (
		<Card className="flex flex-1 flex-col space-y-2 py-5 px-6">
			{feedbackStream.length !== 0 ? (
				<StudentFeedbackStream
					studentEmail={email}
					courseId={courseId}
					initialFeedbackStream={feedbackStream}
					cursor={cursor}
				/>
			) : (
				<Heading size="large">
					When {user.name} gets feedback on their work, it&apos;ll
					show up here
				</Heading>
			)}
		</Card>
	)
}
