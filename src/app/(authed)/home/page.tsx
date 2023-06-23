import { cookies } from "next/headers"
import { and, eq, gt, isNotNull, isNull, or } from "drizzle-orm"
import Link from "next/link"

import Card from "~/components/Card"
import Row from "~/components/Row"
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

const HomePage = async () => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const [
		{ isTeaching, assignmentsTeaching },
		{ isEnrolled, assignmentsEnrolled },
	] = await Promise.all([
		db
			.select({
				courseId: teacherToCourse.courseId,
				assignmentId: assignment.assignmentId,
				title: assignment.title,
				dueAt: assignment.dueAt,
			})
			.from(teacherToCourse)
			.leftJoin(
				assignment,
				eq(assignment.courseId, teacherToCourse.courseId)
			)
			.where(
				and(
					eq(teacherToCourse.teacherEmail, email),
					or(
						gt(assignment.dueAt, new Date()),
						isNull(assignment.dueAt)
					)
				)
			)
			.then((rows) => ({
				isTeaching: rows.length !== 0,
				assignmentsTeaching: rows
					.map((row) =>
						row.assignmentId !== null &&
						row.title !== null &&
						row.dueAt !== null
							? {
									courseId: row.courseId,
									assignmentId: row.assignmentId,
									title: row.title,
									dueAt: row.dueAt,
							  }
							: undefined
					)
					.filter(Boolean),
			})),
		db
			.select({
				courseId: studentToCourse.courseId,
				assignmentId: assignment.assignmentId,
				title: assignment.title,
				dueAt: assignment.dueAt,
			})
			.from(studentToCourse)
			.leftJoin(
				assignment,
				eq(assignment.courseId, studentToCourse.courseId)
			)
			.where(
				and(
					eq(studentToCourse.studentEmail, email),
					or(
						gt(assignment.dueAt, new Date()),
						isNull(assignment.dueAt)
					)
				)
			)
			.then((rows) => ({
				isEnrolled: rows.length !== 0,
				assignmentsEnrolled: rows
					.map((row) =>
						row.assignmentId !== null &&
						row.title !== null &&
						row.dueAt !== null
							? {
									courseId: row.courseId,
									assignmentId: row.assignmentId,
									title: row.title,
									dueAt: row.dueAt,
							  }
							: undefined
					)
					.filter(Boolean),
			})),
	])

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
