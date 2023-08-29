import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Course from "~/data/Course"
import User from "~/data/User"
import cn from "~/utils/cn"
import FeedbackStream from "./FeedbackStream"
import UserFeedbackStream from "./UserFeedbackStream"
import Card from "~/components/Card"
import GradientText from "~/components/GradientText"
import Heading from "~/components/Heading"

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
						"text-6xl font-extrabold leading-none tracking-tight mobile:text-2xl",
						course.syncedUrl !== undefined &&
							"transition-all duration-150 group-hover:opacity-80 peer-active:opacity-80"
					)}
				>
					{course.name}
				</GradientText>

				{course.section && (
					<div
						className={cn(
							"relative top-1 mr-1 ml-3 flex-shrink-0 text-base font-semibold leading-none text-black/70 mobile:mr-0 mobile:text-sm",
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
		const { feedbackStream, cursor } = await Course({
			id: courseId,
		}).feedbackStream({
			limit: 20,
		})

		return (
			<>
				{courseHeader}

				<Card className="flex flex-1 flex-col space-y-2 py-5 px-6">
					{feedbackStream.length !== 0 ? (
						<FeedbackStream
							courseId={courseId}
							initialFeedbackStream={feedbackStream}
							cursor={cursor}
						/>
					) : (
						<Heading size="large">
							When your students get feedback on their work,
							it&apos;ll show up here
						</Heading>
					)}
				</Card>
			</>
		)
	} else if (role === "student") {
		const { feedbackStream, cursor } = await User({
			email,
		}).feedbackStream({
			courseId,
			limit: 20,
		})

		return (
			<>
				{courseHeader}

				<Card className="flex flex-1 flex-col space-y-2 py-5 px-6">
					{feedbackStream.length !== 0 ? (
						<UserFeedbackStream
							courseId={courseId}
							userEmail={email}
							initialFeedbackStream={feedbackStream}
							cursor={cursor}
						/>
					) : (
						<Heading size="large">
							When you get feedback on their work, it&apos;ll show
							up here
						</Heading>
					)}
				</Card>
			</>
		)
	}
}
