import { Logger } from "next-axiom"

import getCompletion from "~/ai/getCompletion"
import GoogleAPI from "~/google/GoogleAPI"
import Course from "~/data/Course"
import Assignment from "~/data/Assignment"

export default async function syncAssignment({
	courseId,
	assignmentId,
}: {
	courseId: string
	assignmentId: string
}) {
	const log = new Logger()

	const [assignment, courseName] = await Promise.all([
		(async () => {
			const refreshToken = await Course({
				id: courseId,
			}).syncedRefreshToken()

			if (refreshToken === undefined)
				return log.error(
					"Course linked refresh token could not be found for assignment sync",
					{ courseId, assignmentId }
				)

			const googleAPI = await GoogleAPI({
				refreshToken,
			})

			const assignmentWithAllAttachments = await googleAPI.assignment({
				courseId,
				assignmentId,
			})

			return (
				assignmentWithAllAttachments && {
					...assignmentWithAllAttachments,
					attachments: (
						await Promise.all(
							assignmentWithAllAttachments.attachments.map(
								async (attachment) =>
									attachment.type === "driveFile"
										? {
												...attachment.driveFile,
												text: await googleAPI.driveFileText(
													{
														id: attachment.driveFile
															.id,
													}
												),
										  }
										: undefined
							)
						)
					).filter(Boolean),
				}
			)
		})(),
		Course({ id: courseId })
			.get()
			.then((course) => {
				return course?.name
			}),
	])

	if (assignment === undefined) {
		return log.error("Assignment could not be found for assignment sync", {
			courseId,
			assignmentId,
		})
	}

	if (courseName === undefined) {
		return log.error("Course could not be found for assignment sync", {
			courseId,
			assignmentId,
		})
	}

	const usedAttachments: {
		id: string
		title: string | undefined
		text: string
	}[] = []

	let totalCost = 0

	if (assignment.attachments.length !== 0) {
		const internalAttachmentMessages = [
			{
				role: "system" as "system" | "user" | "assistant",
				content: `You will be provided with the title${
					assignment.description !== undefined
						? ", teacher-set description,"
						: ""
				} and attachments for an assignment in Google Classroom. Based on this title${
					assignment.description !== undefined
						? " and description"
						: ""
				}, identify the numbers that correspond to content that could be included in the instructions on the assignment. If applicable, use a comma-separated list or write "None".`,
			},
			{
				role: "user" as "system" | "user" | "assistant",
				content: `<title>${assignment.title}</title>

${
	assignment.description !== undefined
		? `<description>
${assignment.description}
</description>\n\n`
		: ""
}${assignment.attachments
					.map(
						(attachment, index) =>
							`<number>${index + 1}</number>
${
	attachment.title !== undefined
		? `<document-title>${attachment.title}</document-title>\n`
		: ""
}<content>
${attachment.text}
</content>`
					)
					.join("\n\n")}`,
			},
		]

		const { completion, cost } = await getCompletion({
			messages: internalAttachmentMessages,
			model: "gpt-3.5-turbo-0613",
			temperature: 0,
			presencePenalty: 0,
			frequencyPenalty: 0,
		})

		totalCost += cost

		log.info(
			"Assignment sync internal attachment instructions identification",
			{
				courseId,
				assignmentId,
				internalAttachmentMessages: internalAttachmentMessages
					.map(({ content }) => content)
					.concat(completion),
			}
		)

		const indexes = completion
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
				.filter((_, index) => indexes.includes(index))
		)
	}

	if (usedAttachments.length === 0) {
		const instructionsPredictionMessages = [
			{
				role: "user" as "system" | "user" | "assistant",
				content: `Briefly respond with something that sounds like it would be the instructions on an assignment titled "${
					assignment.title
				}"${
					assignment.description !== undefined
						? ` with a description of "${assignment.description}"`
						: ""
				} in a course named ${courseName} in Google Classroom.`,
			},
		]

		const { completion: predictedInstructionsCompletion, cost } =
			await getCompletion({
				messages: instructionsPredictionMessages,
				model: "gpt-3.5-turbo-0613",
				temperature: 0,
				presencePenalty: 0,
				frequencyPenalty: 0,
				maxTokens: 100,
			})

		totalCost += cost

		log.info("Assignment sync instructions prediction", {
			courseId,
			assignmentId,
			instructionsPredictionMessages: instructionsPredictionMessages
				.map(({ content }) => content)
				.concat(predictedInstructionsCompletion),
		})

		const attachmentCandidates = await Course({
			id: courseId,
		}).searchResources({
			similarText: predictedInstructionsCompletion,
			filter: {},
			topK: 15,
		})

		const driveFilesUnfiltered = attachmentCandidates
			.map((attachment) =>
				"driveId" in attachment
					? {
							driveId: attachment.driveId,
							driveTitle: attachment.driveTitle,
							text: attachment.text,
					  }
					: undefined
			)
			.filter(Boolean)

		const driveFiles: typeof driveFilesUnfiltered = []

		const wordLimit = 3000

		let words = 0

		for (const driveFile of driveFilesUnfiltered) {
			const wordCount = driveFile.text
				.split(/\s/)
				.filter((word) => word.trim() !== "").length

			if (words + wordCount > wordLimit) break

			words += wordCount

			driveFiles.push(driveFile)
		}

		if (driveFiles.length !== 0) {
			const externalAttachmentMessages = [
				{
					role: "system" as "system" | "user" | "assistant",
					content: `You will be provided with the title${
						assignment.description !== undefined
							? " and teacher-set description"
							: ""
					} of an assignment in Google Classroom along with documents in Google Classroom that are possibly instructions on this assignment. Based on this title${
						assignment.description !== undefined
							? " and description"
							: ""
					}, identify the numbers that correspond to documents that should be included in the instructions on the assignment. If applicable, use a comma-separated list or write "None".`,
				},
				{
					role: "user" as "system" | "user" | "assistant",
					content: `<title>${assignment.title}</title>

${
	assignment.description !== undefined
		? `<description>
${assignment.description}
</description>\n\n`
		: ""
}${driveFiles
						.map(
							(attachment, index) =>
								`<number>${index + 1}</number>
${
	attachment.driveTitle !== undefined
		? `<document-title>${attachment.driveTitle}</document-title>\n`
		: ""
}<content>
${attachment.text}
</content>`
						)
						.join("\n\n")}`,
				},
			]

			const { completion, cost } = await getCompletion({
				messages: externalAttachmentMessages,
				model: "gpt-3.5-turbo-0613",
				temperature: 0,
				presencePenalty: 0,
				frequencyPenalty: 0,
			})

			totalCost += cost

			log.info(
				"Assignment sync external attachment instructions identification",
				{
					courseId,
					assignmentId,
					externalAttachmentMessages: externalAttachmentMessages
						.map(({ content }) => content)
						.concat(completion),
				}
			)

			const indexes = completion
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
					.filter((_, index) => indexes.includes(index))
			)
		}
	}

	const instructions =
		usedAttachments.length !== 0 || assignment.description !== undefined
			? `${
					usedAttachments.length !== 0
						? usedAttachments.length === 1 &&
						  assignment.description === undefined &&
						  usedAttachments[0]
							? usedAttachments[0].text
							: `${usedAttachments
									.map(
										(attachment) =>
											`${
												attachment.title !== undefined
													? `Document title: ${attachment.title}\n`
													: ""
											}Content: ${attachment.text}`
									)
									.join("\n\n")}${
									assignment.description !== undefined
										? "\n\n"
										: ""
							  }`
						: ""
			  }${
					assignment.description !== undefined
						? `${
								usedAttachments.length !== 0
									? "Assignment description: "
									: ""
						  }${assignment.description}`
						: ""
			  }`
			: undefined

	await Promise.all([
		...usedAttachments.map((attachment) =>
			Course({ id: courseId }).updateResources({
				set: {
					instructionsForAssignmentId: assignment.id,
				},
				filter: {
					driveId: attachment.id,
				},
			})
		),
		assignment.description !== undefined &&
			Course({ id: courseId }).createResource({
				text: assignment.description,
				instructionsForAssignmentId: assignment.id,
			}),
		instructions !== undefined &&
			Assignment({
				courseId,
				assignmentId: assignment.id,
			}).update({
				instructions,
				syncedAt: new Date(),
			}),
		Course({ id: courseId }).increaseCost({ sync: totalCost }),
	])
}
