import inngest from "~/background/inngest"
import Resource from "~/data/Resource"
import Assignment from "~/data/Assignment"
import GoogleAPI from "~/google/GoogleAPI"
import getCompletion from "~/ai/getCompletion"
// prompts are same regardless of whether there is just single attachment
// account for the fact that some teachers may include instructions in a student submission document
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
		return

		const googleAPI = await GoogleAPI({
			accessToken: googleAccessToken,
			refreshToken: googleRefreshToken,
			expiresMillis: googleRefreshTokenExpiresMillis,
			onRefreshAccessToken: () => {},
		})

		const [assignments, materials] = await Promise.all([
			googleAPI.courseAssignments({ courseId: id }).then((assignments) =>
				Promise.all(
					assignments.map(async (assignment) => {
						const attachments = await Promise.all(
							assignment.attachments
								.map((attachment) =>
									attachment.type === "driveFile"
										? attachment.driveFile
										: undefined
								)
								.filter(Boolean)
								.map(async (attachment) => {
									const text = await step.run(
										"Index assignment attachment",
										async () => {
											const text =
												await googleAPI.getDriveFileText(
													{
														id: attachment.id,
													}
												)

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

											return text
										}
									)

									return { ...attachment, text }
								})
						)

						return {
							...assignment,
							attachments,
						}
					})
				)
			),
			googleAPI.courseMaterials({ courseId: id }).then((materials) =>
				Promise.all(
					materials.map(async (material) => {
						const attachments = await Promise.all(
							material.attachments
								.map((attachment) =>
									attachment.type === "driveFile"
										? attachment.driveFile
										: undefined
								)
								.filter(Boolean)
								.map(async (attachment) => {
									const text = await step.run(
										"Index material attachment",
										async () => {
											const text =
												await googleAPI.getDriveFileText(
													{
														id: attachment.id,
													}
												)

											await Resource({
												courseId: id,
											}).create({
												text,
												driveId: attachment.id,
												driveTitle: attachment.title,
												attachmentOnMaterialId:
													material.id,
												attachmentOnMaterialTitle:
													material.title,
											})

											return text
										}
									)

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
				)
			),
		])

		console.log(JSON.stringify([assignments, materials], null, 4))

		return

		await Promise.all(
			assignments.map(
				async (assignment) =>
					await step.run(
						"Find and update instructions and context on assignment",
						async () => {
							const usedAttachments: typeof assignment.attachments =
								[]

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
					? `Title: ${attachment.title}\n\n`
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
													? `Given that the title of the assignment in Google Classroom is ${assignment.title}, identify the numbers corresponding to the content that is likely to be instructions on that assignment. If there are multiple answers, use a comma-separated list. Respond with "None" if none of the provided content is likely to be instructions on the assignment.`
													: `Given that the title of the assignment in Google Classroom is ${assignment.title}, is this description likely to be the instructions on the assignment? Respond with yes or no.`
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
										...assignment.attachments.filter(
											(_, index) =>
												indexes.includes(index)
										)
									)

									useDescription = indexes.includes(
										assignment.attachments.length
									)
								} else {
									useDescription =
										response.toLowerCase() === "yes"
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
												content: `Respond with something that sounds like it could be the instructions on an assignment titled "${assignment.title}" in a course named ${name} in Google Classroom.`,
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
					? `Title: ${driveFile.driveTitle}\n\n`
					: ""
			}Content: ${driveFile.text}`
	)
	.join("\n\n")}

Given that the title of the assignment in Google Classroom is ${
												assignment.title
											}, identify the numbers corresponding to the content that is likely to be instructions on that assignment. If there are multiple answers, use a comma-separated list. Respond with "None" if none of the provided content is likely to be instructions on the assignment.`,
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
									...assignment.attachments.filter(
										(_, index) => indexes.includes(index)
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
																			? `Title: ${attachment.title}\n\n`
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
					? `Title: ${driveFile.driveTitle}\n\n`
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
												? `Title: ${driveFile.driveTitle}\n\n`
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
									dueAt: assignment.dueAt,
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
