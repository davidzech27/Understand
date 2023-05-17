"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Assignment from "~/data/Assignment"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const createAssignmentAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
		title: z.string().min(1),
		instructions: z.string().min(1),
		studentDescription: z.string().min(1).optional(),
		dueAt: z.date().optional(),
	})
)(
	async ({
		courseId,
		assignmentId,
		title,
		instructions,
		studentDescription,
		dueAt,
	}) => {
		const { email } = await getAuthOrThrow({ cookies: cookies() })

		const role = await User({ email }).courseRole({ id: courseId })

		if (role !== "teacher") return

		await Assignment({ courseId, assignmentId }).create({
			title,
			studentDescription,
			instructions,
			context: undefined,
			dueAt,
			linkedUrl: undefined,
		})
	}
)

export default createAssignmentAction
