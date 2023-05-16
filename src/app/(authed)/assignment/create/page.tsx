import { cookies } from "next/headers"

import CreateAssignmentForm from "./CreateAssignmentForm"
import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"

export const metadata = {
	title: "Create assignment",
}

const AssignmentCreatePage = () => {
	const coursesTeachingPromise = getAuthOrThrow({ cookies: cookies() })
		.then(({ email }) => User({ email }).courses())
		.then((courses) => courses.teaching)

	return (
		<CreateAssignmentForm coursesTeachingPromise={coursesTeachingPromise} />
	)
}

export default AssignmentCreatePage
