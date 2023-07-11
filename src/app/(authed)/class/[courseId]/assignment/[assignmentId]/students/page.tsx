import { and, eq } from "drizzle-orm"

import Card from "~/components/Card"
import db from "~/db/db"
import { studentToCourse, user, feedback } from "~/db/schema"
import ClassFeedback from "./ClassFeedback"

export const metadata = {
	title: "Students",
}

export const runtime = "edge"

export const dynamic = "force-dynamic"

interface Params {
	courseId: string
	assignmentId: string
}

const AssignmentStudentsPage = async ({
	params: { courseId, assignmentId },
}: {
	params: Params
}) => {
	const [studentProfiles, studentEmailWithFeedbackSet] = await Promise.all([
		db
			.select({
				email: user.email,
				name: user.name,
				photo: user.photo,
			})
			.from(studentToCourse)
			.innerJoin(user, eq(user.email, studentToCourse.studentEmail))
			.where(eq(studentToCourse.courseId, courseId)),
		db
			.selectDistinct({ userEmail: feedback.userEmail })
			.from(feedback)
			.where(
				and(
					eq(feedback.courseId, courseId),
					eq(feedback.assignmentId, assignmentId)
				)
			)
			.then((rows) => new Set(rows.map(({ userEmail }) => userEmail))),
	])

	const students = studentProfiles.map(({ email, name, photo }) => ({
		email,
		name,
		photo: photo ?? undefined,
		feedback: studentEmailWithFeedbackSet.has(email),
	}))

	return (
		<Card className="flex h-full flex-col px-6 pt-5 pb-80">
			<ClassFeedback
				courseId={courseId}
				assignmentId={assignmentId}
				students={students}
			/>
		</Card>
	)
}

export default AssignmentStudentsPage
