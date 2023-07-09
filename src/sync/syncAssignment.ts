import getCompletion from "~/ai/getCompletion"
import GoogleAPI from "~/google/GoogleAPI"
import Course from "~/data/Course"
import Assignment from "~/data/Assignment"

const syncAssignment = async ({
	courseId,
	assignmentId,
}: {
	courseId: string
	assignmentId: string
}) => {
	const [assignment, courseName] = await Promise.all([
		(async () => {
			const refreshToken = await Course({
				id: courseId,
			}).linkedRefreshToken()

			if (refreshToken === undefined)
				throw new Error(
					"Linked refresh token could not be found for course"
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
				if (course === undefined)
					throw new Error("Course could not be found in database")

				return course.name
			}),
	])

	if (assignment === undefined) {
		return console.error("Not found", { courseId, assignmentId })
	}

	const usedAttachments: {
		id: string
		title: string | undefined
		text: string
	}[] = []

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

		const response = await getCompletion({
			messages: internalAttachmentMessages,
			model: "gpt-3.5-turbo-0613",
			temperature: 0,
			presencePenalty: 0,
			frequencyPenalty: 0,
		})

		console.info("Sync", {
			courseId,
			assignmentId,
			assignmentTitle: assignment.title,
			internalAttachmentMessages: internalAttachmentMessages.concat({
				role: "assistant",
				content: response,
			}),
		})

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
				.filter((_, index) => indexes.includes(index))
		)
	}

	if (usedAttachments.length === 0) {
		const instructionPredictionMessages = [
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

		const predictedInstructions = await getCompletion({
			messages: instructionPredictionMessages,
			model: "gpt-3.5-turbo-0613",
			temperature: 0,
			presencePenalty: 0,
			frequencyPenalty: 0,
			maxTokens: 100,
		})

		console.info("Sync", {
			courseId,
			assignmentId,
			assignmentTitle: assignment.title,
			instructionPredictionMessages: instructionPredictionMessages.concat(
				{ role: "assistant", content: predictedInstructions }
			),
		})

		const attachmentCandidates = await Course({
			id: courseId,
		}).searchResources({
			similarText: predictedInstructions,
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

			const response = await getCompletion({
				messages: externalAttachmentMessages,
				model: "gpt-3.5-turbo-0613",
				temperature: 0,
				presencePenalty: 0,
				frequencyPenalty: 0,
			})

			console.info("Sync", {
				courseId,
				assignmentId,
				assignmentTitle: assignment.title,
				externalAttachmentMessages: externalAttachmentMessages.concat({
					role: "assistant",
					content: response,
				}),
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
			}),
	])
}

export default syncAssignment
