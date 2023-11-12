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
		addTeacherEmails: z.string().array(),
		removeTeacherEmails: z.string().array(),
		addStudentEmails: z.string().array(),
		removeStudentEmails: z.string().array(),
	}),
)(async ({
	id,
	name,
	section,
	addTeacherEmails,
	removeTeacherEmails,
	addStudentEmails,
	removeStudentEmails,
}) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id })

	if (role !== "teacher") return

	await Promise.all([
		Course({ id }).update({ name, section: section ?? null }),
		addTeacherEmails.map((email) =>
			User({ email }).addToCourse({
				id,
				role: "teacher",
				synced: false,
			}),
		),
		removeTeacherEmails.map((email) =>
			User({ email }).removeFromCourse({ id, role: "teacher" }),
		),
		addStudentEmails.map((email) =>
			User({ email }).addToCourse({
				id,
				role: "student",
				synced: false,
			}),
		),
		removeStudentEmails.map((email) =>
			User({ email }).removeFromCourse({ id, role: "student" }),
		),
	])
})

export default updateCourseAction
