import Course from "~/data/Course"
import User from "~/data/User"
import GoogleAPI from "~/google/GoogleAPI"

export default async function syncRoster({ courseId }: { courseId: string }) {
	const [dbRoster, classroomRoster] = await Promise.all([
		Promise.all([
			Course({ id: courseId }).teachers(),
			Course({ id: courseId }).students(),
		]).then(([teachers, students]) => ({ teachers, students })),
		Course({ id: courseId })
			.syncedRefreshToken()
			.then((refreshToken) => {
				if (refreshToken === undefined)
					throw new Error(
						"Synced refresh token could not be found for course"
					)

				return GoogleAPI({ refreshToken })
			})
			.then((googleAPI) => googleAPI.courseRoster({ courseId })),
	])

	const dbTeacherEmailSet = new Set(
		dbRoster.teachers.map(({ email }) => email)
	)

	const dbSyncedTeacherEmails = dbRoster.teachers
		.filter(({ syncedAt }) => syncedAt !== undefined)
		.map(({ email }) => email)

	const classroomTeacherEmailSet = new Set(
		classroomRoster.teachers.map(({ email }) => email).filter(Boolean)
	)

	const dbStudentEmailSet = new Set(
		dbRoster.students.map(({ email }) => email)
	)

	const dbSyncedStudentEmails = dbRoster.students
		.filter(({ syncedAt }) => syncedAt !== undefined)
		.map(({ email }) => email)

	const classroomStudentEmailSet = new Set(
		classroomRoster.students.map(({ email }) => email)
	)

	await Promise.all([
		...classroomRoster.teachers.map(({ email }) => {
			if (email && !dbTeacherEmailSet.has(email))
				return User({ email }).addToCourse({
					id: courseId,
					role: "teacher",
					synced: true,
				})

			return undefined
		}),
		...dbSyncedTeacherEmails.map((email) => {
			if (!classroomTeacherEmailSet.has(email))
				return User({ email }).removeFromCourse({
					id: courseId,
					role: "teacher",
				})

			return undefined
		}),
		...classroomRoster.students.map(({ email }) => {
			if (!dbStudentEmailSet.has(email))
				return User({ email }).addToCourse({
					id: courseId,
					role: "student",
					synced: true,
				})

			return undefined
		}),
		...dbSyncedStudentEmails.map((email) => {
			if (!classroomStudentEmailSet.has(email))
				return User({ email }).removeFromCourse({
					id: courseId,
					role: "student",
				})

			return undefined
		}),
	])
}
