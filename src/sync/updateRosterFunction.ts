import { NonRetriableError } from "inngest"

import inngest from "~/background/inngest"
import GoogleAPI from "~/google/GoogleAPI"
import User from "~/data/User"
import Course from "~/data/Course"

const updateRoster = inngest.createFunction(
	{ name: "Update roster from Classroom" },
	{ event: "classroom/roster.updated" },
	async ({
		event: {
			data: { courseId, email, role },
		},
	}) => {
		const credentials = await Course({ id: courseId }).linkedCredentials()

		if (
			credentials === undefined ||
			credentials.accessToken === undefined ||
			credentials.refreshToken === undefined
		)
			throw new NonRetriableError(
				"Google credentials for course could not be found in database"
			)

		const googleAPI = await GoogleAPI({
			accessToken: credentials.accessToken,
			refreshToken: credentials.refreshToken,
			expiresMillis: 0,
			onRefreshAccessToken: async ({ accessToken }) => {
				await Course({
					id: courseId,
				}).update({
					linkedAccessToken: accessToken,
				})
			},
		})

		const roster = await googleAPI.courseRoster({ courseId })

		if (
			roster.teachers
				.map((teacher) => teacher.email)
				.concat(roster.students.map((student) => student.email))
				.includes(email)
		) {
			await User({ email }).addToCourse({ id: courseId, role })
		} else {
			await User({ email }).removeFromCourse({ id: courseId, role })
		}
	}
)

export default updateRoster
