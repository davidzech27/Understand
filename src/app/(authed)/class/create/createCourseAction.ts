"use server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Course from "~/data/Course"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const createCourseAction = zact(
	z.object({
		name: z.string(),
		section: z.string().optional(),
		additionalTeacherEmails: z.string().array(),
		studentEmails: z.string().array(),
	})
)(async ({ name, section, additionalTeacherEmails, studentEmails }) => {
	const id =
		new Date().valueOf().toString() +
		Math.floor(Math.random() * 1_000_000).toString() // milliseconds after epoch appended by 6 random digits

	const { email } = await getAuthOrThrow({ cookies: cookies() })

	additionalTeacherEmails = additionalTeacherEmails.filter(
		(email) => z.string().email().safeParse(email).success
	)

	studentEmails = studentEmails.filter(
		(email) => z.string().email().safeParse(email).success
	)

	await Promise.all([
		Course({ id }).create({ name, section }),
		User({ email }).addToCourse({ id, role: "teacher" }),
		additionalTeacherEmails.map((email) =>
			User({ email }).addToCourse({ id, role: "teacher" })
		),
		studentEmails.map((email) =>
			User({ email }).addToCourse({ id, role: "student" })
		),
	])

	console.log("finished")

	redirect(`/class/${id}`)
})

export default createCourseAction
