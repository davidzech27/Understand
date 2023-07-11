import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import Course from "~/data/Course"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"
import Roster from "./Roster"

export const metadata = {
	title: "People",
}

export const runtime = "edge"

interface Params {
	courseId: string
}

const PeoplePage = async ({ params: { courseId } }: { params: Params }) => {
	const [role, roster] = await Promise.all([
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
		Course({ id: courseId }).roster(),
	])

	if (role === "none") notFound()

	return <Roster courseId={courseId} role={role} roster={roster} />
}

export default PeoplePage
