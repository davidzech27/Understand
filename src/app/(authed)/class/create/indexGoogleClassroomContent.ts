import inngest from "~/background/inngest"
import Resource from "~/data/Resource"
import Assignment from "~/data/Assignment"
import GoogleAPI from "~/google/GoogleAPI"
import getCompletion from "~/ai/getCompletion"
// prompts are same regardless of whether there is just single attachment
// account for the fact that some teachers may include instructions in a student submission document
// potentially do topic by topic for greater reliability
// todo - think about ways order assignments in interface, and also how to support chatbot that would access recent assignments
// todo - support more attachment types. consider breaking attachments up if we don't end up using Anthropic's 100k token limit
const indexGoogleClassroomContent = inngest.createFunction(
	{
		name: "Index Google Classroom content of linked course",
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
						`Find and update instructions and context on assignment with id ${assignment.id}`,
						async () => {
							const usedAttachments: {
								id: string
								title: string | undefined
								text: string
							}[] = []

							let useDescription = false

							if (
								assignment.attachments.length !== 0 ||
								assignment.description !== undefined
							) {
								const response = await getCompletion({
									messages: [
										{
											role: "system",
											content:
												"You are careful and precise.",
										},
										{
											role: "user",
											content: `${
												assignment.attachments
													.length !== 0
													? `The following are the attachments on an assignment in Google Classroom with a title of ${
															assignment.title
													  }:

${assignment.attachments
	.map(
		(attachment, index) =>
			`${index + 1}. ${
				attachment.title !== undefined
					? `Document title: ${attachment.title}\n\n`
					: ""
			}Content: ${attachment.text}\n\n`
	)
	.join("")}`
													: ""
											}${
												assignment.description !==
												undefined
													? `The following is the description set by the teacher on ${
															assignment
																.attachments
																.length !== 0
																? `that same assignment`
																: `an assignment in Google Classroom with a title of ${assignment.title}`
													  }:

${
	assignment.attachments.length !== 0
		? `${assignment.attachments.length + 1}. `
		: ""
}${assignment.description}\n\n`
													: ""
											}${
												assignment.attachments
													.length !== 0
													? `Given that the title of the assignment in Google Classroom is ${assignment.title}, identify the numbers corresponding to the content that is likely to be a part of the instructions on that assignment. If there are multiple answers, use a comma-separated list. Respond with "None" if none of the provided content is likely to be instructions on the assignment.`
													: `Given that the title of the assignment in Google Classroom is ${assignment.title}, is this description likely to be a part of the instructions on the assignment? Respond with yes or no.`
											}`,
										},
									],
									model: "gpt-3.5-turbo",
									temperature: 0,
									presencePenalty: 0,
									frequencyPenalty: 0,
								})

								if (assignment.attachments.length !== 0) {
									const indexes = response
										.replaceAll(/\s/g, "")
										.toLowerCase()
										.split(",")
										.map(Number)
										.map((number) => number - 1)

									usedAttachments.push(
										...assignment.attachments
											.map((attachment) => ({
												id: attachment.id,
												title: attachment.title,
												text: attachment.text,
											}))
											.filter((_, index) =>
												indexes.includes(index)
											)
									)

									useDescription = indexes.includes(
										assignment.attachments.length
									)
								} else {
									useDescription = response
										.toLowerCase()
										.includes("yes")
								}
							}

							if (
								usedAttachments.length === 0 &&
								(!useDescription ||
									assignment.attachments.length === 0)
							) {
								const predictedInstructions =
									await getCompletion({
										messages: [
											{
												role: "system",
												content:
													"You are careful and precise.",
											},
											{
												role: "user",
												content: `Respond with something that sounds like it could be the instructions on an assignment titled "${
													assignment.title
												}"${
													assignment.description !==
													undefined
														? ` and with a description of ${assignment.description}`
														: ""
												} in a course named ${name} in Google Classroom.`,
											},
										],
										model: "gpt-3.5-turbo",
										temperature: 0,
										presencePenalty: 0,
										frequencyPenalty: 0,
										maxTokens: 200,
									})

								const attachmentCandidates = await Resource({
									courseId: id,
								}).search({
									similarText: predictedInstructions,
									where: {},
									topK: 15,
								})

								const driveFilesUnfiltered =
									attachmentCandidates
										.map((attachment) =>
											"driveId" in attachment
												? {
														driveId:
															attachment.driveId,
														driveTitle:
															attachment.driveTitle,
														text: attachment.text,
												  }
												: undefined
										)
										.filter(Boolean)

								const driveFiles: typeof driveFilesUnfiltered =
									[]

								const wordLimit = 3000

								let words = 0

								for (const driveFile of driveFilesUnfiltered) {
									const wordCount = driveFile.text
										.split(/\s/)
										.filter(
											(word) => word.trim() !== ""
										).length

									if (words + wordCount > wordLimit) break

									words += wordCount

									driveFiles.push(driveFile)
								}

								const response = await getCompletion({
									messages: [
										{
											role: "system",
											content:
												"You are careful and precise.",
										},
										{
											role: "user",
											content: `The following are attachments in a Google Classroom class that are potentially instructions for an assignment titled ${
												assignment.title
											}:

${driveFiles
	.map(
		(driveFile, index) =>
			`${index + 1}. ${
				driveFile.driveTitle !== undefined
					? `Document title: ${driveFile.driveTitle}\n\n`
					: ""
			}Content: ${driveFile.text}`
	)
	.join("\n\n")}

Given that the title of the assignment in Google Classroom is ${
												assignment.title
											}, identify the numbers corresponding to the content that is likely to be a part of the instructions on that assignment. If there are multiple answers, use a comma-separated list. Respond with "None" if none of the provided content is likely to be instructions on the assignment.`,
										},
									],
									model: "gpt-3.5-turbo",
									temperature: 0,
									presencePenalty: 0,
									frequencyPenalty: 0,
								})

								const indexes = response
									.replaceAll(/\s/g, "")
									.toLowerCase()
									.split(",")
									.map(Number)
									.map((number) => number - 1)

								usedAttachments.push(
									...driveFiles
										.map((driveFile) => ({
											id: driveFile.driveId,
											title: driveFile.driveTitle,
											text: driveFile.text,
										}))
										.filter((_, index) =>
											indexes.includes(index)
										)
								)
							}

							const instructions =
								usedAttachments.length !== 0 || useDescription
									? `${
											usedAttachments.length !== 0
												? usedAttachments.length ===
														1 &&
												  !useDescription &&
												  usedAttachments[0]
													? usedAttachments[0].text
													: `${usedAttachments
															.map(
																(attachment) =>
																	`${
																		attachment.title !==
																		undefined
																			? `Instructions document title: ${attachment.title}\n\n`
																			: ""
																	}Content: ${
																		attachment.text
																	}`
															)
															.join("\n\n")}${
															useDescription
																? "\n\n"
																: ""
													  }`
												: ""
									  }${
											useDescription
												? `${
														usedAttachments.length !==
														0
															? "Assignment description: "
															: ""
												  }${assignment.description}`
												: ""
									  }`
									: undefined

							let context: string | undefined = undefined

							if (instructions !== undefined) {
								const contextCandidates = await Resource({
									courseId: id,
								}).search({
									similarText: instructions,
									where: {},
									topK: 15,
								})

								const driveFilesUnfiltered = contextCandidates
									.map((attachment) =>
										"driveId" in attachment
											? {
													driveId: attachment.driveId,
													driveTitle:
														attachment.driveTitle,
													text: attachment.text,
											  }
											: undefined
									)
									.filter(Boolean)

								const driveFiles: typeof driveFilesUnfiltered =
									[]

								const wordLimit = 3000

								let words = 0

								for (const driveFile of driveFilesUnfiltered) {
									const wordCount = driveFile.text
										.split(/\s/)
										.filter(
											(word) => word.trim() !== ""
										).length

									if (words + wordCount > wordLimit) break

									words += wordCount

									driveFiles.push(driveFile)
								}

								const response = await getCompletion({
									messages: [
										{
											role: "system",
											content:
												"You are careful and precise.",
										},
										{
											role: "user",
											content: `The following are instructions on an assignment in Google Classroom titled ${
												assignment.title
											}:

${instructions}

The following are resources in Google Classroom that are potentially relevant to the assignment.

${driveFiles
	.map(
		(driveFile, index) =>
			`${index + 1}. ${
				driveFile.driveTitle !== undefined
					? `Document title: ${driveFile.driveTitle}\n\n`
					: ""
			}Content: ${driveFile.text}`
	)
	.join("\n\n")}

Identify the numbers corresponding to the resources that are likely to provide helpful context for someone to better understand what the teacher may be looking for in a student's work on the assignment. If there are multiple answers, use a comma-separated list. Respond with "None" if none of the provided resources are likely to help someone to better understand what the teacher is looking for in a student's work on the assignment.`,
										},
									],
									model: "gpt-3.5-turbo",
									temperature: 0,
									presencePenalty: 0,
									frequencyPenalty: 0,
								})

								const indexes = response
									.replaceAll(/\s/g, "")
									.toLowerCase()
									.split(",")
									.map(Number)
									.map((number) => number - 1)

								for (const index of indexes) {
									const driveFile = driveFiles[index]

									if (driveFile !== undefined) {
										if (context === undefined) context = ""

										context += `${
											driveFile.driveTitle !== undefined
												? `Document title: ${driveFile.driveTitle}\n\n`
												: ""
										}Content: ${driveFile.text}\n\n`
									}
								}

								context = context?.trimEnd()
							}

							await Promise.all([
								...usedAttachments.map((attachment) =>
									Resource({ courseId: id }).update({
										set: {
											instructionsForAssignmentId:
												assignment.id,
											instructionsForAssignmentTitle:
												assignment.title,
										},
										where: {
											driveId: attachment.id,
										},
									})
								),
								useDescription &&
									assignment.description &&
									Resource({ courseId: id }).create({
										text: assignment.description,
										instructionsForAssignmentId:
											assignment.id,
										instructionsForAssignmentTitle:
											assignment.title,
									}),
								Assignment({
									courseId: id,
									assignmentId: assignment.id,
								}).create({
									title: assignment.title,
									description: assignment.description,
									instructions,
									context,
									dueAt:
										assignment.dueAt === undefined
											? undefined
											: new Date(
													new Date(
														assignment.dueAt
													).getTime() +
														new Date(
															assignment.dueAt
														).getTimezoneOffset() *
															60 *
															1000
											  ),
									linkedUrl: assignment.url,
								}),
							])
						}
					)
			)
		)
	}
)

export default indexGoogleClassroomContent
