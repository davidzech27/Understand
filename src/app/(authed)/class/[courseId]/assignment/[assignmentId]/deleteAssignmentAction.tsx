"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Assignment from "~/data/Assignment"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const deleteAssignmentAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
	})
)(async ({ courseId, assignmentId }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	if (role !== "teacher") return

	await Assignment({ courseId, assignmentId }).delete()
})

export default deleteAssignmentAction
