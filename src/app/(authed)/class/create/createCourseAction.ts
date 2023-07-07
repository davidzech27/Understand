"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import isEmailValid from "~/utils/isEmailValid"
import Course from "~/data/Course"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"
import syncCourse from "~/sync/syncCourse"
import GoogleAPI from "~/google/GoogleAPI"

const createCourseAction = zact(
	z.object({
		id: z.string(),
		name: z.string().min(1),
		section: z.string().min(1).optional(),
		linkedAdditionalTeacherEmails: z.string().array(),
		linkedStudentEmails: z.string().array(),
		unlinkedAdditionalTeacherEmails: z.string().array(),
		unlinkedStudentEmails: z.string().array(),
		linkedUrl: z.string().url().optional(),
	})
)(
	async ({
		id,
		name,
		section,
		linkedAdditionalTeacherEmails,
		linkedStudentEmails,
		unlinkedAdditionalTeacherEmails,
		unlinkedStudentEmails,
		linkedUrl,
	}) => {
		const { email, ...creatorAuth } = await getAuthOrThrow({
			cookies: cookies(),
		})

		if (linkedUrl !== undefined) {
			const googleAPI = await GoogleAPI({
				refreshToken: creatorAuth.googleRefreshToken,
			})

			const coursesTeaching = await googleAPI.coursesTeaching()

			if (
				!coursesTeaching.map(({ id }) => id).includes(id) &&
				!(await User({ email }).get())?.superuser
			) {
				throw new Error(
					"Must be teacher of Google Classroom course to link to it"
				)
			}
		}

		linkedAdditionalTeacherEmails =
			linkedAdditionalTeacherEmails.filter(isEmailValid)

		linkedStudentEmails = linkedStudentEmails.filter(isEmailValid)

		unlinkedAdditionalTeacherEmails =
			unlinkedAdditionalTeacherEmails.filter(isEmailValid)

		unlinkedStudentEmails = unlinkedStudentEmails.filter(isEmailValid)

		await Promise.all([
			Course({ id }).create({
				name,
				section,
				...(linkedUrl !== undefined
					? {
							linkedUrl,
							linkedRefreshToken: creatorAuth.googleRefreshToken,
					  }
					: {
							linkedUrl: undefined,
							linkedRefreshToken: undefined,
					  }),
			}),
			User({ email }).addToCourse({ id, role: "teacher", linked: false }),
			...linkedAdditionalTeacherEmails.map(
				async (email) =>
					await User({ email }).addToCourse({
						id,
						role: "teacher",
						linked: true,
					})
			),
			...linkedStudentEmails.map(
				async (email) =>
					await User({ email }).addToCourse({
						id,
						role: "student",
						linked: true,
					})
			),
			...unlinkedAdditionalTeacherEmails.map(
				async (email) =>
					await User({ email }).addToCourse({
						id,
						role: "teacher",
						linked: false,
					})
			),
			...unlinkedStudentEmails.map(
				async (email) =>
					await User({ email }).addToCourse({
						id,
						role: "student",
						linked: false,
					})
			),
		])

		if (linkedUrl !== undefined) {
			await syncCourse({ id })
		}
	}
)

export default createCourseAction
