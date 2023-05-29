import Resource from "~/data/Resource"
import Assignment from "~/data/Assignment"
import getCompletion from "~/ai/getCompletion"

const createAssignmentWithInstructionsAndContext = async ({
	assignment,
	courseId,
	courseName,
}: {
	assignment: {
		id: string
		title: string
		url: string
		attachments: {
			text: string
			id: string
			title?: string | undefined
			url: string
			thumbnailUrl?: string | undefined
		}[]
		description?: string | undefined
		dueAt?: Date | undefined
	}
	courseId: string
	courseName: string
}) => {
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
					content: "You are careful and precise.",
				},
				{
					role: "user",
					content: `${
						assignment.attachments.length !== 0
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
						assignment.description !== undefined
							? `The following is the description set by the teacher on ${
									assignment.attachments.length !== 0
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
						assignment.attachments.length !== 0
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
					.filter((_, index) => indexes.includes(index))
			)

			useDescription = indexes.includes(assignment.attachments.length)
		} else {
			useDescription = response.toLowerCase().includes("yes")
		}
	}

	if (
		usedAttachments.length === 0 &&
		(!useDescription || assignment.attachments.length === 0)
	) {
		const predictedInstructions = await getCompletion({
			messages: [
				{
					role: "system",
					content: "You are careful and precise.",
				},
				{
					role: "user",
					content: `Respond with something that sounds like it could be the instructions on an assignment titled "${
						assignment.title
					}"${
						assignment.description !== undefined
							? ` and with a description of ${assignment.description}`
							: ""
					} in a course named ${courseName} in Google Classroom.`,
				},
			],
			model: "gpt-3.5-turbo",
			temperature: 0,
			presencePenalty: 0,
			frequencyPenalty: 0,
			maxTokens: 200,
		})

		const attachmentCandidates = await Resource({
			courseId,
		}).search({
			similarText: predictedInstructions,
			where: {},
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

		const response = await getCompletion({
			messages: [
				{
					role: "system",
					content: "You are careful and precise.",
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
				.filter((_, index) => indexes.includes(index))
		)
	}

	const instructions =
		usedAttachments.length !== 0 || useDescription
			? `${
					usedAttachments.length !== 0
						? usedAttachments.length === 1 &&
						  !useDescription &&
						  usedAttachments[0]
							? usedAttachments[0].text
							: `${usedAttachments
									.map(
										(attachment) =>
											`${
												attachment.title !== undefined
													? `Instructions document title: ${attachment.title}\n\n`
													: ""
											}Content: ${attachment.text}`
									)
									.join("\n\n")}${
									useDescription ? "\n\n" : ""
							  }`
						: ""
			  }${
					useDescription
						? `${
								usedAttachments.length !== 0
									? "Assignment description: "
									: ""
						  }${assignment.description}`
						: ""
			  }`
			: undefined

	let context: string | undefined = undefined

	if (instructions !== undefined) {
		const contextCandidates = await Resource({
			courseId,
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

		const response = await getCompletion({
			messages: [
				{
					role: "system",
					content: "You are careful and precise.",
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
			Resource({ courseId }).update({
				set: {
					instructionsForAssignmentId: assignment.id,
					instructionsForAssignmentTitle: assignment.title,
				},
				where: {
					driveId: attachment.id,
				},
			})
		),
		useDescription &&
			assignment.description &&
			Resource({ courseId }).create({
				text: assignment.description,
				instructionsForAssignmentId: assignment.id,
				instructionsForAssignmentTitle: assignment.title,
			}),
		Assignment({
			courseId,
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

export default createAssignmentWithInstructionsAndContext
