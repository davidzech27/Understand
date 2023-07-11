import { cookies } from "next/headers"
import { and, eq, gt, isNotNull, isNull, or } from "drizzle-orm"
import Link from "next/link"

import Card from "~/components/Card"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"
import db from "~/db/db"
import {
	course,
	teacherToCourse,
	studentToCourse,
	assignment,
} from "~/db/schema"
import UpcomingAssignments from "./UpcomingAssignments"

export const metadata = {
	title: "Home",
}

export const runtime = "edge"

const HomePage = async () => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const { assignmentsTeaching, assignmentsEnrolled, isEnrolled, isTeaching } =
		await User({ email }).upcomingAssignments()

	return (
		<Card className="flex h-full flex-col justify-between overflow-y-scroll border py-5 px-6 shadow-lg">
			{!isTeaching && !isEnrolled ? (
				<span className="opacity-60">
					You&apos;re not teaching or enrolled in any classes. Either
					ask a teacher for an invite or use the plus button in the
					upper right corner to create one
				</span>
			) : (
				<div className="flex flex-col space-y-2">
					{isEnrolled ? (
						<>
							<div className="ml-1 text-lg font-medium opacity-60">
								{!isTeaching
									? "Upcoming assignments"
									: "Upcoming assignments to do"}
							</div>

							<UpcomingAssignments
								assignments={assignmentsEnrolled}
								role="student"
							/>
						</>
					) : null}

					{isTeaching ? (
						<>
							<div className="ml-1 text-lg font-medium opacity-60">
								{!isEnrolled
									? "Upcoming assignments"
									: "Upcoming assignments to review"}
							</div>

							<UpcomingAssignments
								assignments={assignmentsTeaching}
								role="teacher"
							/>
						</>
					) : null}
				</div>
			)}
		</Card>
	)
}

export default HomePage
