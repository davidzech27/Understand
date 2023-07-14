import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"
import Card from "~/components/Card"
import UnorderedList from "~/components/UnorderedList"
import AssignmentItem from "~/components/AssignmentItem"
import Heading from "~/components/Heading"

export const metadata = {
	title: "Home",
}

export const runtime = "edge"

export default async function HomePage() {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const { assignmentsTeaching, assignmentsEnrolled, isEnrolled, isTeaching } =
		await User({ email }).upcomingAssignments()

	return (
		<Card className="flex h-full flex-col justify-between overflow-y-scroll border py-5 px-6 shadow-lg">
			{!isTeaching && !isEnrolled ? (
				<Heading size="medium">
					You&apos;re not teaching or enrolled in any classes. Either
					ask a teacher for an invite or use the plus button in the
					upper right corner to create one
				</Heading>
			) : (
				<div className="flex flex-col space-y-2">
					{isEnrolled ? (
						<>
							<Heading size="large" className="ml-1">
								{!isTeaching
									? "Upcoming assignments"
									: "Upcoming assignments to do"}
							</Heading>

							<UnorderedList
								items={assignmentsEnrolled}
								renderItem={({
									courseId,
									assignmentId,
									title,
									dueAt,
								}) => (
									<AssignmentItem
										title={title}
										dueAt={dueAt}
										href={`/class/${courseId}/feedback/${assignmentId}`}
										key={assignmentId}
									/>
								)}
								renderEmpty={() => (
									<Heading size="large" className="ml-1">
										This is where you&apos;ll see the
										upcoming assignments for all the classes
										you&apos;re in
									</Heading>
								)}
							/>
						</>
					) : null}

					{isTeaching ? (
						<>
							<Heading size="large" className="ml-1">
								{!isEnrolled
									? "Upcoming assignments"
									: "Upcoming assignments to review"}
							</Heading>

							<UnorderedList
								items={assignmentsTeaching}
								renderItem={({
									courseId,
									assignmentId,
									title,
									dueAt,
								}) => (
									<AssignmentItem
										title={title}
										dueAt={dueAt}
										href={`/class/${courseId}/assignment/${assignmentId}`}
										key={assignmentId}
									/>
								)}
								renderEmpty={() => (
									<Heading size="large" className="ml-1">
										This is where you&apos;ll see the
										upcoming assignments for all the classes
										you&apos;re teaching
									</Heading>
								)}
							/>
						</>
					) : null}
				</div>
			)}
		</Card>
	)
}
