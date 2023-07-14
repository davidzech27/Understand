import { cookies } from "next/headers"

import Card from "~/components/Card"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"
import FeedbackHistory from "./FeedbackHistory"
import MessageBoard from "./MessageBoard"
import Course from "~/data/Course"

export const runtime = "edge"

interface Params {
	courseId: string
}

export default async function ClassPage({
	params: { courseId },
}: {
	params: Params
}) {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	if (role === "teacher") {
		const { feedbackHistory, cursor } = await Course({
			id: courseId,
		}).feedbackHistory({
			limit: 20,
		})

		return (
			<Card className="flex flex-1 flex-col space-y-2 py-5 px-6">
				{feedbackHistory.length !== 0 ? (
					<FeedbackHistory
						courseId={courseId}
						initialFeedbackHistory={feedbackHistory}
						cursor={cursor}
					/>
				) : (
					<div className="text-lg font-medium opacity-60">
						When your students get feedback on their work,
						it&apos;ll show up here
					</div>
				)}
			</Card>
		)
	} else if (role === "student") {
		return (
			<Card className="flex flex-1 flex-col py-5 px-6">
				<MessageBoard courseId={courseId} />
			</Card>
		)
	}
}
