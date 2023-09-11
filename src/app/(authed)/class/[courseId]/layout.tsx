import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Logger } from "next-axiom"

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
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	try {
		const [role, course] = await Promise.all([
			User({ email }).courseRole({ id: params.courseId }),
			Course({ id: params.courseId }).get(),
		])

		if (role === "none" || course === undefined) notFound()

		await Promise.all([
			course.syncedUrl !== undefined &&
				syncCourse({
					id: params.courseId,
				}),
			role === "teacher" &&
				generateInsights({
					courseId: params.courseId,
				}),
		])
	} catch (error) {
		const log = new Logger()

		log.error("Error initiating course sync", { email, error })

		await log.flush()
	}

	return <>{children}</>
}
