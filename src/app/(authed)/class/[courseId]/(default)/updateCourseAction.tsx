"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Course from "~/data/Course"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const updateCourseAction = zact(
	z.object({
		id: z.string(),
		name: z.string().min(1).optional(),
		section: z.string().min(1).optional(),
	})
)(async ({ id, name, section }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id })

	if (role !== "teacher") return

	await Course({ id }).update({ name, section })
})

export default updateCourseAction
