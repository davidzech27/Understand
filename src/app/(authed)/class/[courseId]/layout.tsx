import { cookies } from "next/headers"

import syncCourse from "~/sync/syncCourse"
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
			if (role !== "none" && course?.linkedUrl !== undefined)
				syncCourse({ id: params.courseId })
		})

	return children
}

export default CourseLayout
