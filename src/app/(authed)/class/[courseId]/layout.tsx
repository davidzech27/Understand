import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import generateInsights from "~/insights/generateInsights"
import User from "~/data/User"

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
		const [role] = await User({ email }).courseRole({ id: params.courseId })

		if (role === "none") notFound()

		if (role === "teacher") {
			await generateInsights({
				courseId: params.courseId,
			})
		}
	} catch (error) {
		console.error("Error initiating course sync", { email, error })
	}

	return <>{children}</>
}
