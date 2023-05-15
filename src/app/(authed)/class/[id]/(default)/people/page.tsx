import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import Course from "~/data/Course"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"
import Roster from "./Roster"

export const metadata = {
	title: "People",
}

interface Params {
	id: string
}

const PeoplePage = async ({ params: { id } }: { params: Params }) => {
	const [role, roster] = await Promise.all([
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id })
		),
		Course({ id }).roster(),
	])

	if (role === "none") notFound()

	return <Roster courseId={id} role={role} roster={roster} />
}

export default PeoplePage
