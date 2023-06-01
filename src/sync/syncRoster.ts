import Course from "~/data/Course"
import User from "~/data/User"
import GoogleAPI from "~/google/GoogleAPI"

const syncRoster = async ({ courseId }: { courseId: string }) => {
	const [dbRoster, classroomRoster] = await Promise.all([
		Course({ id: courseId }).roster(),
		Course({ id: courseId })
			.linkedRefreshToken()
			.then((refreshToken) => {
				if (refreshToken === undefined)
					throw new Error(
						"Linked refresh token could not be found for course"
					)

				return GoogleAPI({ refreshToken })
			})
			.then((googleAPI) => googleAPI.courseRoster({ courseId })),
	])

	const dbTeacherEmailSet = new Set(
		dbRoster.teachers.map(({ email }) => email)
	)

	const dbLinkedTeacherEmails = dbRoster.teachers
		.filter(({ linked }) => linked)
		.map(({ email }) => email)

	const classroomTeacherEmailSet = new Set(
		classroomRoster.teachers.map(({ email }) => email).filter(Boolean)
	)

	const dbStudentEmailSet = new Set(
		dbRoster.students.map(({ email }) => email)
	)

	const dbLinkedStudentEmails = dbRoster.students
		.filter(({ linked }) => linked)
		.map(({ email }) => email)

	const classroomStudentEmailSet = new Set(
		classroomRoster.students.map(({ email }) => email)
	)

	await Promise.all([
		...classroomRoster.teachers.map(
			({ email }) =>
				email &&
				!dbTeacherEmailSet.has(email) &&
				User({ email }).addToCourse({
					id: courseId,
					role: "teacher",
					linked: true,
				})
		),
		...dbLinkedTeacherEmails.map(
			(email) =>
				!classroomTeacherEmailSet.has(email) &&
				User({ email }).removeFromCourse({
					id: courseId,
					role: "teacher",
				})
		),
		...classroomRoster.students.map(
			({ email }) =>
				email &&
				!dbStudentEmailSet.has(email) &&
				User({ email }).addToCourse({
					id: courseId,
					role: "student",
					linked: true,
				})
		),
		...dbLinkedStudentEmails.map(
			(email) =>
				!classroomStudentEmailSet.has(email) &&
				User({ email }).removeFromCourse({
					id: courseId,
					role: "student",
				})
		),
	])
}

export default syncRoster
