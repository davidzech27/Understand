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
		syncedAdditionalTeacherEmails: z.string().array(),
		syncedStudentEmails: z.string().array(),
		unsyncedAdditionalTeacherEmails: z.string().array(),
		unsyncedStudentEmails: z.string().array(),
		syncedUrl: z.string().url().optional(),
	})
)(
	async ({
		id,
		name,
		section,
		syncedAdditionalTeacherEmails,
		syncedStudentEmails,
		unsyncedAdditionalTeacherEmails,
		unsyncedStudentEmails,
		syncedUrl,
	}) => {
		const { email, ...auth } = await getAuthOrThrow({
			cookies: cookies(),
		})

		if (syncedUrl !== undefined) {
			if (auth.school === undefined)
				throw new Error(
					"Must be registered with a school to link to a Google Classroom class"
				)

			const googleAPI = await GoogleAPI({
				refreshToken: auth.googleRefreshToken,
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

		syncedAdditionalTeacherEmails =
			syncedAdditionalTeacherEmails.filter(isEmailValid)

		syncedStudentEmails = syncedStudentEmails.filter(isEmailValid)

		unsyncedAdditionalTeacherEmails =
			unsyncedAdditionalTeacherEmails.filter(isEmailValid)

		unsyncedStudentEmails = unsyncedStudentEmails.filter(isEmailValid)

		await Promise.all([
			Course({ id }).create({
				name,
				section,
				...(syncedUrl !== undefined
					? {
							syncedUrl,
							syncedRefreshToken: auth.googleRefreshToken,
					  }
					: {
							syncedUrl: undefined,
							syncedRefreshToken: undefined,
					  }),
			}),
			User({ email }).addToCourse({ id, role: "teacher", synced: false }),
			...syncedAdditionalTeacherEmails.map(
				async (email) =>
					await User({ email }).addToCourse({
						id,
						role: "teacher",
						synced: true,
					})
			),
			...syncedStudentEmails.map(
				async (email) =>
					await User({ email }).addToCourse({
						id,
						role: "student",
						synced: true,
					})
			),
			...unsyncedAdditionalTeacherEmails.map(
				async (email) =>
					await User({ email }).addToCourse({
						id,
						role: "teacher",
						synced: false,
					})
			),
			...unsyncedStudentEmails.map(
				async (email) =>
					await User({ email }).addToCourse({
						id,
						role: "student",
						synced: false,
					})
			),
		])

		if (syncedUrl !== undefined) {
			await syncCourse({ id })
		}
	}
)

export default createCourseAction
