import { cookies } from "next/headers"

import syncCourse from "~/sync/syncCourse"
import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"

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
			User({ email }).courseRole({ id: params.courseId })
		)
		.then((role) => {
			if (role !== "none") syncCourse({ id: params.courseId })
		})

	return children
}

export default CourseLayout
