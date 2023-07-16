import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import syncCourse from "~/sync/syncCourse"
import generateInsights from "~/insights/generateInsights"
import User from "~/data/User"
import Course from "~/data/Course"

interface Params {
	courseId: string
}

export default async function CourseLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Params
}) {
	//! not sure if adding latency. look into if there's a NextJS app router waterfall
	try {
		await getAuthOrThrow({ cookies: cookies() })
			.then(({ email }) =>
				Promise.all([
					User({ email }).courseRole({ id: params.courseId }),
					Course({ id: params.courseId }).get(),
				])
			)
			.then(([role, course]) => {
				if (role === "none" || course === undefined) notFound()

				return Promise.all([
					course.linkedUrl !== undefined &&
						syncCourse({
							id: params.courseId,
						}),
					role === "teacher" &&
						generateInsights({
							courseId: params.courseId,
						}),
				])
			})
	} catch (error) {
		console.error(error)
	}

	return children
}
