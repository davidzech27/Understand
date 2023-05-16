"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import Course from "~/data/Course"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const isEmailValid = (email: string) =>
	email.search(
		/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g
	) !== -1

const createCourseAction = zact(
	z.object({
		id: z.string(),
		name: z.string().min(1),
		section: z.string().min(1).optional(),
		additionalTeacherEmails: z.string().array(),
		studentEmails: z.string().array(),
		googleClassroomId: z.string().optional(),
	})
)(
	async ({
		id,
		name,
		section,
		additionalTeacherEmails,
		studentEmails,
		googleClassroomId,
	}) => {
		const { email } = await getAuthOrThrow({ cookies: cookies() })

		additionalTeacherEmails = additionalTeacherEmails.filter(isEmailValid)

		studentEmails = studentEmails.filter(isEmailValid)

		await Promise.all([
			Course({ id }).create({ name, section, googleClassroomId }),
			User({ email }).addToCourse({ id, role: "teacher" }),
			additionalTeacherEmails.map((email) =>
				User({ email }).addToCourse({ id, role: "teacher" })
			),
			studentEmails.map((email) =>
				User({ email }).addToCourse({ id, role: "student" })
			),
		])
	}
)

export default createCourseAction
