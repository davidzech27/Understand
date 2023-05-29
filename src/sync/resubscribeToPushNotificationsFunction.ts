import { sql } from "drizzle-orm"

import inngest from "~/background/inngest"
import Course from "~/data/Course"
import db from "~/db/db"
import { course } from "~/db/schema"
import GoogleAPI from "~/google/GoogleAPI"

//! not scalable but whatever
const resubscribeToPushNotifications = inngest.createFunction(
	{ name: "Resubscribe to classroom push notifications every week" },
	{ cron: "0 0 * * */7" },
	async ({ step }) => {
		const courses = (
			await db
				.select({
					id: course.id,
					accessToken: course.linkedAccessToken,
					refreshToken: course.linkedRefreshToken,
				})
				.from(course)
				.where(sql`linked_url IS NOT NULL`)
		)
			.map(({ id, accessToken, refreshToken }) =>
				accessToken !== null && refreshToken !== null
					? { id, accessToken, refreshToken }
					: undefined
			)
			.filter(Boolean)

		await Promise.all(
			courses.map(
				async ({ id, accessToken, refreshToken }) =>
					await step.run(
						`Resubscribe to classroom push notifications for course with id ${id}`,
						async () => {
							const googleAPI = await GoogleAPI({
								accessToken,
								refreshToken,
								expiresMillis: 0,
								onRefreshAccessToken: async ({
									accessToken,
								}) => {
									await Course({ id }).update({
										linkedAccessToken: accessToken,
									})
								},
							})

							await googleAPI.subscribeToPushNotifications({
								courseId: id,
							})
						}
					)
			)
		)
	}
)

export default resubscribeToPushNotifications