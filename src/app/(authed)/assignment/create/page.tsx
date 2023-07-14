import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"
import CreateAssignmentForm from "./CreateAssignmentForm"

export const metadata = {
	title: "Create assignment",
}

export const runtime = "edge"

export default function AssignmentCreatePage() {
	const coursesTeachingPromise = getAuthOrThrow({ cookies: cookies() }).then(
		({ email }) => User({ email }).coursesTeaching()
	)

	return (
		<CreateAssignmentForm coursesTeachingPromise={coursesTeachingPromise} />
	)
}
