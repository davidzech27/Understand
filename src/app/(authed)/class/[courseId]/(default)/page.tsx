import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Course from "~/data/Course"
import User from "~/data/User"
import FeedbackHistory from "./FeedbackHistory"
import cn from "~/utils/cn"
import MessageBoard from "./MessageBoard"
import Card from "~/components/Card"
import GradientText from "~/components/GradientText"

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

	const [course, role] = await Promise.all([
		Course({ id: courseId }).get(),
		User({ email }).courseRole({ id: courseId }),
	])

	if (course === undefined) notFound()

	const courseHeader = (
		<Card className="px-6 py-5">
			<a
				href={course.syncedUrl}
				target="_blank"
				rel="noreferrer"
				className="group flex items-center justify-between"
			>
				<GradientText
					className={cn(
						"text-6xl font-extrabold leading-none tracking-tight",
						course.syncedUrl !== undefined &&
							"transition-all duration-150 group-hover:opacity-80 peer-active:opacity-80"
					)}
				>
					{course.name}
				</GradientText>

				{course.section && (
					<div
						className={cn(
							"relative top-1 mr-1 ml-3 flex-shrink-0 text-base font-semibold leading-none text-black/70",
							course.syncedUrl !== undefined &&
								"transition-all duration-150 group-hover:opacity-50 group-active:opacity-50"
						)}
					>
						{course.section}
					</div>
				)}
			</a>
		</Card>
	)

	if (role === "teacher") {
		const { feedbackHistory, cursor } = await Course({
			id: courseId,
		}).feedbackHistory({
			limit: 20,
		})

		return (
			<>
				{courseHeader}

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
			</>
		)
	} else if (role === "student") {
		return (
			<>
				{courseHeader}

				<Card className="flex flex-1 flex-col py-5 px-6">
					<MessageBoard courseId={courseId} />
				</Card>
			</>
		)
	}
}
