import inngest from "~/background/inngest"
import Resource from "~/data/Resource"
import GoogleAPI from "~/google/GoogleAPI"
import createAssignmentWithInstructionsAndContext from "./createAssignmentWithInstructionsAndContext"
// prompts are same regardless of whether there is just single attachment
// account for the fact that some teachers may include instructions in a student submission document
// potentially do topic by topic for greater reliability
// todo - think about ways order assignments in interface, and also how to support chatbot that would access recent assignments
// todo - support more attachment types. consider breaking attachments up if we don't end up using Anthropic's 100k token limit
const importClassroom = inngest.createFunction(
	{
		name: "Import Classroom content from linked course",
	},
	{ event: "app/linkedCourse.created" },
	async ({
		event: {
			data: {
				id,
				name,
				creatorAuth: {
					googleAccessToken,
					googleRefreshToken,
					googleRefreshTokenExpiresMillis,
				},
			},
		},
		step,
	}) => {
		//! currently expires after 7 days. also isn't being undone when course is deleted. make solution where this runs every 7 days until course is deleted. or potentially code that runs every 7 days updating subscriptions. would require that refresh token is stored in database
		await step.run(
			"Subscribe to classroom push notifications",
			async () => {
				const googleAPI = await GoogleAPI({
					accessToken: googleAccessToken,
					refreshToken: googleRefreshToken,
					expiresMillis: googleRefreshTokenExpiresMillis,
					onRefreshAccessToken: () => {},
				})

				await googleAPI.subscribeToPushNotifications({ courseId: id })
			}
		)

		const [assignmentsWithoutText, materialsWithoutText] = await step.run(
			"Get assignments and materials",
			async () => {
				const googleAPI = await GoogleAPI({
					accessToken: googleAccessToken,
					refreshToken: googleRefreshToken,
					expiresMillis: googleRefreshTokenExpiresMillis,
					onRefreshAccessToken: () => {},
				})

				return await Promise.all([
					googleAPI.courseAssignments({ courseId: id }),
					googleAPI.courseMaterials({ courseId: id }),
				])
			}
		)

		const [assignments, materials] = await step.run(
			"Index assignments and materials",
			async () => {
				const googleAPI = await GoogleAPI({
					accessToken: googleAccessToken,
					refreshToken: googleRefreshToken,
					expiresMillis: googleRefreshTokenExpiresMillis,
					onRefreshAccessToken: () => {},
				})

				return await Promise.all([
					Promise.all(
						assignmentsWithoutText.map(async (assignment) => {
							const attachments = await Promise.all(
								assignment.attachments
									.map((attachment) =>
										attachment.type === "driveFile"
											? attachment.driveFile
											: undefined
									)
									.filter(Boolean)
									.map(async (attachment) => {
										const text =
											await googleAPI.driveFileText({
												id: attachment.id,
											})

										await Resource({
											courseId: id,
										}).create({
											text,
											driveId: attachment.id,
											driveTitle: attachment.title,
											attachmentOnAssignmentId:
												assignment.id,
											attachmentOnAssignmentTitle:
												assignment.title,
										})

										return { ...attachment, text }
									})
							)

							return {
								...assignment,
								attachments,
							}
						})
					),
					Promise.all(
						materialsWithoutText.map(async (material) => {
							const attachments = await Promise.all(
								material.attachments
									.map((attachment) =>
										attachment.type === "driveFile"
											? attachment.driveFile
											: undefined
									)
									.filter(Boolean)
									.map(async (attachment) => {
										const text =
											await googleAPI.driveFileText({
												id: attachment.id,
											})

										await Resource({
											courseId: id,
										}).create({
											text,
											driveId: attachment.id,
											driveTitle: attachment.title,
											attachmentOnMaterialId: material.id,
											attachmentOnMaterialTitle:
												material.title,
										})

										return {
											...attachment,
											text,
										}
									})
							)

							return {
								...material,
								attachments,
							}
						})
					),
				])
			}
		)

		await Promise.all(
			assignments.map(
				async (assignment) =>
					await step.run(
						`Find instructions and context for and create assignment with id ${assignment.id}`,
						async () => {
							await createAssignmentWithInstructionsAndContext({
								assignment: {
									...assignment,
									dueAt:
										assignment.dueAt !== undefined
											? new Date(assignment.dueAt)
											: undefined,
								},
								courseId: id,
								courseName: name,
							})
						}
					)
			)
		)
	}
)

export default importClassroom
