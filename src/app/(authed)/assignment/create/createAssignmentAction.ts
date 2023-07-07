"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import { getAuthOrThrow } from "~/auth/jwt"
import Assignment from "~/data/Assignment"
import Course from "~/data/Course"
import User from "~/data/User"

const createAssignmentAction = zact(
	z.object({
		courseId: z.string(),
		assignmentId: z.string(),
		title: z.string().min(1),
		instructions: z.string().min(1),
		description: z.string().min(1).optional(),
		dueAt: z.date().optional(),
	})
)(
	async ({
		courseId,
		assignmentId,
		title,
		instructions,
		description,
		dueAt,
	}) => {
		const { email } = await getAuthOrThrow({ cookies: cookies() })

		const role = await User({ email }).courseRole({ id: courseId })

		if (role !== "teacher") return

		await Promise.all([
			Assignment({ courseId, assignmentId }).create({
				title,
				description,
				instructions,
				context: undefined,
				dueAt,
				linkedUrl: undefined,
				instructionsLinked: false,
			}),
			Course({ id: courseId }).createResource({
				instructionsForAssignmentId: assignmentId,
				text: instructions,
			}),
		])
	}
)

export default createAssignmentAction
