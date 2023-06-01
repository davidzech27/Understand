"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Assignment from "~/data/Assignment"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const updateAssignmentAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
		title: z.string().min(1),
		description: z.string().min(1).optional(),
		instructions: z.string().min(1),
		instructionsLinked: z.boolean(),
		dueAt: z.date().optional(),
	})
)(
	async ({
		courseId,
		assignmentId,
		title,
		description,
		instructions,
		instructionsLinked,
		dueAt,
	}) => {
		const { email } = await getAuthOrThrow({ cookies: cookies() })

		const role = await User({ email }).courseRole({ id: courseId })

		if (role !== "teacher") return

		await Assignment({ courseId, assignmentId }).update({
			title,
			description,
			instructions,
			dueAt,
			instructionsLinked,
		})
	}
)

export default updateAssignmentAction
