import { NonRetriableError } from "inngest"

import inngest from "~/background/inngest"
import Assignment from "~/data/Assignment"
import Course from "~/data/Course"
import Resource from "~/data/Resource"
import GoogleAPI from "~/google/GoogleAPI"
import createAssignmentWithInstructionsAndContext from "./createAssignmentWithInstructionsAndContext"
//! currently just recreating assignment. I should really be doing more cleanup
const updateAssignment = inngest.createFunction(
	{ name: "Update assignment from Classroom" },
	{ event: "classroom/assignment.updated" },
	async ({
		event: {
			data: { courseId, assignmentId },
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
			expiresMillis: 0, //! really not good system at all for managing tokens. because we're not storing expiresMillis in db, it doesn't matter that we're carrying accessToken,
			onRefreshAccessToken: async ({ accessToken, expiresMillis }) => {
				await Course({
					id: courseId,
				}).update({
					linkedAccessToken: accessToken,
				})
			},
		})

		const [assignment, courseName] = await Promise.all([
			googleAPI
				.assignment({
					courseId,
					assignmentId,
				})
				.then(async (assignment) => {
					if (assignment === undefined)
						throw new NonRetriableError(
							"Assignment could not be found in Google Classroom"
						)

					const attachments = await Promise.all(
						assignment.attachments
							.map((attachment) =>
								attachment.type === "driveFile"
									? attachment.driveFile
									: undefined
							)
							.filter(Boolean)
							.map(async (attachment) => {
								const text = await googleAPI.driveFileText({
									id: attachment.id,
								})

								await Resource({
									courseId,
								}).create({
									text,
									driveId: attachment.id,
									driveTitle: attachment.title,
									attachmentOnAssignmentId: assignment.id,
									attachmentOnAssignmentTitle:
										assignment.title,
								})

								return { ...attachment, text }
							})
					)

					return { ...assignment, attachments }
				}),
			Course({ id: courseId })
				.get()
				.then((course) => {
					if (course === undefined)
						throw new NonRetriableError(
							"Course could not be found in database"
						)

					return course.name
				}),
			Promise.all([
				Resource({ courseId }).getMany({ where: {} }),
				googleAPI.courseMaterials({ courseId }),
			]).then(([indexedResources, classroomMaterials]) => {
				const indexedMaterialAttachmentIds = indexedResources
					.map((resource) =>
						"attachmentOnMaterialId" in resource
							? resource.driveId
							: undefined
					)
					.filter(Boolean)

				const unindexedClassroomMaterialAttachments = classroomMaterials
					.map((material) =>
						material.attachments.map((attachment) => ({
							...attachment,
							materialId: material.id,
							materialTitle: material.title,
						}))
					)
					.flat()
					.map((attachment) =>
						attachment.type === "driveFile"
							? {
									...attachment.driveFile,
									materialId: attachment.materialId,
									materialTitle: attachment.materialTitle,
							  }
							: undefined
					)
					.filter(Boolean)
					.filter(
						(attachment) =>
							!indexedMaterialAttachmentIds.includes(
								attachment.id
							)
					)

				return Promise.all(
					unindexedClassroomMaterialAttachments.map(
						async (attachment) => {
							const text = await googleAPI.driveFileText({
								id: attachment.id,
							})

							await Resource({
								courseId,
							}).create({
								text,
								driveId: attachment.id,
								driveTitle: attachment.title,
								attachmentOnMaterialId: attachment.materialId,
								attachmentOnMaterialTitle:
									attachment.materialTitle,
							})
						}
					)
				)
			}),
		])

		await createAssignmentWithInstructionsAndContext({
			assignment,
			courseId,
			courseName,
		})
	}
)

export default updateAssignment
