import { desc, eq } from "drizzle-orm/expressions"

import db from "~/db/db"
import {
	user,
	course,
	studentToCourse,
	teacherToCourse,
	assignment,
	feedback,
	followUp,
} from "~/db/schema"
import Resource from "./Resource"

const Course = ({ id }: { id: string }) => ({
	create: async ({
		name,
		section,
		linkedUrl,
		linkedAccessToken,
		linkedRefreshToken,
	}: {
		name: string
		section: string | undefined
		linkedUrl: string | undefined
		linkedAccessToken: string | undefined
		linkedRefreshToken: string | undefined
	}) => {
		await db.insert(course).values({
			id,
			name,
			section,
			linkedUrl,
			linkedAccessToken,
			linkedRefreshToken,
		})
	},
	get: async () => {
		const row = (
			await db
				.select({
					linkedUrl: course.linkedUrl, // I have no idea why but this query fails when linkedUrl is last column
					name: course.name,
					section: course.section,
				})
				.from(course)
				.where(eq(course.id, id))
		)[0]

		if (!row) return undefined

		return {
			id,
			name: row.name,
			section: row.section ?? undefined,
			linkedUrl: row.linkedUrl ?? undefined,
		}
	},

	update: async ({
		name,
		section,
		googleClassroomId,
		linkedAccessToken,
		linkedRefreshToken,
	}: {
		name?: string
		section?: string
		googleClassroomId?: string
		linkedAccessToken?: string
		linkedRefreshToken?: string
	}) => {
		await db
			.update(course)
			.set({
				...(name !== undefined ? { name } : {}),
				...(section !== undefined ? { section } : {}),
				...(googleClassroomId !== undefined
					? { googleClassroomId }
					: {}),
				...(linkedAccessToken !== undefined
					? { linkedAccessToken }
					: {}),
				...(linkedRefreshToken !== undefined
					? { linkedRefreshToken }
					: {}),
			})
			.where(eq(course.id, id))
	},
	delete: async () => {
		await Promise.all([
			db.delete(course).where(eq(course.id, id)),
			db.delete(teacherToCourse).where(eq(teacherToCourse.courseId, id)),
			db.delete(studentToCourse).where(eq(studentToCourse.courseId, id)),
			db.delete(assignment).where(eq(assignment.courseId, id)),
			db.delete(feedback).where(eq(feedback.courseId, id)),
			db.delete(followUp).where(eq(followUp.courseId, id)),
			Resource({ courseId: id }).delete({ where: {} }),
		])
	},
	linkedCredentials: async () => {
		const credentials = (
			await db
				.select({
					linkedAccessToken: course.linkedAccessToken,
					linkedRefreshToken: course.linkedRefreshToken,
				})
				.from(course)
				.where(eq(course.id, id))
		)[0]

		return (
			credentials && {
				accessToken: credentials.linkedAccessToken ?? undefined,
				refreshToken: credentials.linkedRefreshToken ?? undefined,
			}
		)
	},
	roster: async () => {
		const [teachers, students] = await Promise.all([
			db
				.select({
					email: teacherToCourse.teacherEmail,
					name: user.name,
					photo: user.photo,
				})
				.from(teacherToCourse)
				.leftJoin(user, eq(user.email, teacherToCourse.teacherEmail))
				.where(eq(teacherToCourse.courseId, id)),
			db
				.select({
					email: studentToCourse.studentEmail,
					name: user.name,
					photo: user.photo,
				})
				.from(studentToCourse)
				.leftJoin(user, eq(user.email, studentToCourse.studentEmail))
				.where(eq(studentToCourse.courseId, id)),
		])

		return {
			teachers: teachers.map((teacher) =>
				teacher.name !== null
					? {
							signedUp: true as const,
							email: teacher.email,
							name: teacher.name,
							photo: teacher.photo ?? undefined,
					  }
					: { signedUp: false as const, email: teacher.email }
			),
			students: students.map((student) =>
				student.name !== null
					? {
							signedUp: true as const,
							email: student.email,
							name: student.name,
							photo: student.photo ?? undefined,
					  }
					: { signedUp: false as const, email: student.email }
			),
		}
	},
	assignments: async () => {
		const assignments = await db
			.select()
			.from(assignment)
			.where(eq(assignment.courseId, id))
			.orderBy(desc(assignment.dueAt))

		return assignments.map((assignment) => ({
			courseId: assignment.courseId,
			assignmentId: assignment.assignmentId,
			title: assignment.title,
			description: assignment.description ?? undefined,
			instructions: assignment.instructions ?? undefined,
			context: assignment.context ?? undefined,
			dueAt: assignment.dueAt ?? undefined,
			linkedUrl: assignment.linkedUrl ?? undefined,
		}))
	},
})

export default Course
