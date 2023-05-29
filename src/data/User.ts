import { and, eq } from "drizzle-orm/expressions"

import db from "~/db/db"
import { user, course, studentToCourse, teacherToCourse } from "~/db/schema"

const User = ({ email }: { email: string }) => ({
	create: async ({
		name,
		photo,
	}: {
		name: string
		photo: string | undefined
	}) => {
		await db
			.insert(user)
			.values({ email, name, photo })
			.onDuplicateKeyUpdate({ set: { email, photo } }) //! remove when feature to change photo is added
	},
	get: async () => {
		const row = (
			await db
				.select({ name: user.name, photo: user.photo })
				.from(user)
				.where(eq(user.email, email))
		)[0]

		if (!row) return undefined

		return {
			email,
			name: row.name,
			photo: row.photo ?? undefined,
		}
	},
	update: async ({ name, photo }: { name?: string; photo?: string }) => {
		await db
			.update(user)
			.set({
				...(name !== undefined ? { name } : {}),
				...(photo !== undefined ? { photo } : {}),
			})
			.where(eq(user.email, email))
	},
	delete: async () => {
		// consider deleting user's feedback
		await Promise.all([
			db.delete(user).where(eq(user.email, email)),
			db
				.delete(teacherToCourse)
				.where(eq(teacherToCourse.teacherEmail, email)),
			db
				.delete(studentToCourse)
				.where(eq(studentToCourse.studentEmail, email)),
		])
	},
	courses: async () => {
		const [teaching, enrolled] = await Promise.all([
			db
				.select({
					id: course.id,
					name: course.name,
					section: course.section,
					linkedUrl: course.linkedUrl,
				})
				.from(teacherToCourse)
				.innerJoin(course, eq(course.id, teacherToCourse.courseId))
				.where(eq(teacherToCourse.teacherEmail, email)),
			db
				.select({
					id: course.id,
					name: course.name,
					section: course.section,
					linkedUrl: course.linkedUrl,
				})
				.from(studentToCourse)
				.innerJoin(course, eq(course.id, studentToCourse.courseId))
				.where(eq(studentToCourse.studentEmail, email)),
		])

		return {
			teaching: teaching.map((course) => ({
				...course,
				section: course.section ?? undefined,
				linkedUrl: course.linkedUrl ?? undefined,
			})),
			enrolled: enrolled.map((course) => ({
				...course,
				section: course.section ?? undefined,
				linkedUrl: course.linkedUrl ?? undefined,
			})),
		}
	},
	addToCourse: async ({
		id,
		role,
	}: {
		id: string
		role: "teacher" | "student"
	}) => {
		if (role === "teacher") {
			await db
				.insert(teacherToCourse)
				.values({
					teacherEmail: email,
					courseId: id,
				})
				.onDuplicateKeyUpdate({ set: { teacherEmail: email } })
		}

		if (role === "student") {
			await db
				.insert(studentToCourse)
				.values({
					studentEmail: email,
					courseId: id,
				})
				.onDuplicateKeyUpdate({ set: { studentEmail: email } })
		}
	},
	removeFromCourse: async ({
		id,
		role,
	}: {
		id: string
		role: "teacher" | "student"
	}) => {
		if (role === "teacher") {
			await db
				.delete(teacherToCourse)
				.where(
					and(
						eq(teacherToCourse.teacherEmail, email),
						eq(teacherToCourse.courseId, id)
					)
				)
		}

		if (role === "student") {
			await db
				.delete(studentToCourse)
				.where(
					and(
						eq(studentToCourse.studentEmail, email),
						eq(studentToCourse.courseId, id)
					)
				)
		}
	},
	courseRole: async ({ id }: { id: string }) => {
		const [teacherRow, studentRow] = await Promise.all([
			db
				.select({ id: teacherToCourse.courseId })
				.from(teacherToCourse)
				.where(
					and(
						eq(teacherToCourse.courseId, id),
						eq(teacherToCourse.teacherEmail, email)
					)
				)
				.then((rows) => rows[0]),
			db
				.select({ id: studentToCourse.courseId })
				.from(studentToCourse)
				.where(
					and(
						eq(studentToCourse.courseId, id),
						eq(studentToCourse.studentEmail, email)
					)
				)
				.then((rows) => rows[0]),
		])

		if (teacherRow !== undefined) return "teacher" as const

		if (studentRow !== undefined) return "student" as const

		return "none" as const
	},
})

export default User
