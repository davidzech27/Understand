"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Course from "~/data/Course"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const deleteCourseAction = zact(
	z.object({
		id: z.string(),
	}),
)(async ({ id }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id })

	if (role !== "teacher") return

	await Course({ id }).delete()
})

export default deleteCourseAction
