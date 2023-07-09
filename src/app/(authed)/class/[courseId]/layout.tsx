import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import syncCourse from "~/sync/syncCourse"
import generateInsights from "~/insights/generateInsights"
import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"
import Course from "~/data/Course"

interface Params {
	courseId: string
}

const CourseLayout = async ({
	children,
	params,
}: {
	children: React.ReactNode
	params: Params
}) => {
	void getAuthOrThrow({ cookies: cookies() })
		.then(({ email }) =>
			Promise.all([
				User({ email }).courseRole({ id: params.courseId }),
				Course({ id: params.courseId }).get(),
			])
		)
		.then(([role, course]) => {
			if (role === "none" || course === undefined) notFound()

			if (course.linkedUrl !== undefined)
				syncCourse({
					id: params.courseId,
				})

			if (role === "teacher")
				generateInsights({
					courseId: params.courseId,
				})
		})

	return children
}

export default CourseLayout
