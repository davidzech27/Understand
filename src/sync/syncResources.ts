import Assignment from "~/data/Assignment"
import Course from "~/data/Course"
import Resource from "~/data/Resource"
import GoogleAPI from "~/google/GoogleAPI"

const syncResources = async ({ courseId }: { courseId: string }) => {
	const googleAPIPromise = Course({ id: courseId })
		.linkedRefreshToken()
		.then((refreshToken) => {
			if (refreshToken === undefined)
				throw new Error(
					"Linked refresh token could not be found for course"
				)

			return GoogleAPI({ refreshToken })
		})

	const [
		dbAssignments,
		vdbResources,
		[classroomAssignments, classroomMaterials],
	] = await Promise.all([
		Course({ id: courseId }).assignments(),
		Resource({ courseId }).getMany({ filter: {} }),
		googleAPIPromise.then((googleAPI) =>
			Promise.all([
				googleAPI.courseAssignments({ courseId }),
				googleAPI.courseMaterials({ courseId }),
			])
		),
	])

	const idToDBLinkedAssignmentMap = new Map(
		dbAssignments
			.map((assignment) =>
				assignment.linkedUrl !== undefined
					? { ...assignment, linkedUrl: assignment.linkedUrl }
					: undefined
			)
			.filter(Boolean)
			.map(({ assignmentId, ...assignment }) => [
				assignmentId,
				assignment,
			])
	)

	const idToVDBDriveFileMap = new Map(
		vdbResources
			.map((resource) =>
				"driveId" in resource
					? {
							...resource,
							driveId: resource.driveId,
							driveTitle: resource.driveTitle,
					  }
					: undefined
			)
			.filter(Boolean)
			.map(({ driveId, ...driveFile }) => [driveId, driveFile])
	)

	const idToClassroomAssignmentMap = new Map(
		classroomAssignments.map(({ id, ...assignment }) => [id, assignment])
	)

	const idToClassroomDriveFileMap = new Map(
		classroomAssignments
			.concat(classroomMaterials)
			.map(({ attachments }) => attachments)
			.flat()
			.map((attachment) =>
				attachment.type === "driveFile"
					? attachment.driveFile
					: undefined
			)
			.filter(Boolean)
			.map(({ id, ...driveFile }) => [id, driveFile])
	)

	let assignmentIdsToSync: string[] = []

	await Promise.all([
		// create all assignments and index attachments on them not in classroom, and update all linked assignments and resources
		...classroomAssignments.map(async (classroomAssignment) => {
			const dbLinkedAssignment = idToDBLinkedAssignmentMap.get(
				classroomAssignment.id
			)

			if (dbLinkedAssignment === undefined) {
				await Promise.all([
					Assignment({
						courseId,
						assignmentId: classroomAssignment.id,
					}).create({
						title: classroomAssignment.title,
						description: classroomAssignment.description,
						dueAt: classroomAssignment.dueAt,
						linkedUrl: classroomAssignment.url,
						instructions: undefined,
						context: undefined,
						instructionsLinked: true,
					}),
					...classroomAssignment.attachments
						.map((attachment) =>
							attachment.type === "driveFile"
								? attachment.driveFile
								: undefined
						)
						.filter(Boolean)
						.map(
							async (driveFile) =>
								await Resource({ courseId }).create({
									driveId: driveFile.id,
									driveTitle: driveFile.title,
									attachmentOnAssignmentId:
										classroomAssignment.id,
									text: await new Promise<string>((res) =>
										setTimeout(
											async () =>
												res(
													await (
														await googleAPIPromise
													).driveFileText({
														id: driveFile.id,
													})
												),
											Math.random() * 1000 * 5 // funky way to prevent too many fetch calls in too short a time
										)
									),
								})
						),
				])

				assignmentIdsToSync.push(classroomAssignment.id)

				return
			}

			await Promise.all([
				(async () => {
					if (
						dbLinkedAssignment.title !==
							classroomAssignment.title ||
						dbLinkedAssignment.description !==
							classroomAssignment.description ||
						dbLinkedAssignment.dueAt?.valueOf() !==
							classroomAssignment.dueAt?.valueOf()
					) {
						await Assignment({
							courseId,
							assignmentId: classroomAssignment.id,
						}).update({
							...(dbLinkedAssignment.title !==
							classroomAssignment.title
								? {
										title: classroomAssignment.title,
								  }
								: {}),
							...(dbLinkedAssignment.description !==
							classroomAssignment.description
								? {
										description:
											classroomAssignment.description ??
											null,
								  }
								: {}),
							...(dbLinkedAssignment.dueAt !==
							classroomAssignment.dueAt
								? {
										dueAt:
											classroomAssignment.dueAt ?? null,
								  }
								: {}),
						})

						assignmentIdsToSync.push(classroomAssignment.id)
					}
				})(),
				(async () => {
					if (
						dbLinkedAssignment.description !==
							classroomAssignment.description &&
						dbLinkedAssignment.instructionsLinked
					) {
						const instructionsOnAssignment = vdbResources.filter(
							(resource) =>
								resource.instructionsForAssignmentId ===
								classroomAssignment.id
						)

						if (
							instructionsOnAssignment.find(
								(instructions) =>
									!("driveId" in instructions) ||
									instructions.driveId === undefined
							) !== undefined
						) {
							const driveIdsOfInstructionsOnAssignment =
								instructionsOnAssignment
									.map((resource) =>
										"driveId" in resource
											? resource.driveId
											: undefined
									)
									.filter(Boolean)

							if (classroomAssignment.description === undefined) {
								return await Resource({ courseId }).delete({
									filter: {
										instructionsForAssignmentId:
											classroomAssignment.id,
										driveId: {
											$nin: driveIdsOfInstructionsOnAssignment,
										},
									},
								})
							}

							await Resource({
								courseId,
							}).update({
								set: {
									text: classroomAssignment.description,
								},
								filter: {
									instructionsForAssignmentId:
										classroomAssignment.id,
									driveId: {
										$nin: driveIdsOfInstructionsOnAssignment,
									},
								},
							})
						}
					}
				})(),
				...classroomAssignment.attachments
					.map((attachment) =>
						attachment.type === "driveFile"
							? attachment.driveFile
							: undefined
					)
					.filter(Boolean)
					.map(async (classroomDriveFile) => {
						const vdbDriveFile = idToVDBDriveFileMap.get(
							classroomDriveFile.id
						)

						const classroomDriveFileText =
							await new Promise<string>((res) =>
								setTimeout(
									async () =>
										res(
											await (
												await googleAPIPromise
											).driveFileText({
												id: classroomDriveFile.id,
											})
										),
									Math.random() * 1000 * 5
								)
							)

						if (vdbDriveFile === undefined) {
							await Resource({ courseId }).create({
								driveId: classroomDriveFile.id,
								driveTitle: classroomDriveFile.title,
								attachmentOnAssignmentId:
									classroomAssignment.id,
								text: classroomDriveFileText,
							})

							assignmentIdsToSync.push(classroomAssignment.id)

							return
						}

						if (
							vdbDriveFile.text.trim() !==
								classroomDriveFileText.trim() ||
							vdbDriveFile.driveTitle !== classroomDriveFile.title
						) {
							await Resource({ courseId }).update({
								filter: {
									driveId: classroomDriveFile.id,
								},
								set: {
									text: classroomDriveFileText,
									driveTitle: classroomDriveFile.title,
								},
							})

							assignmentIdsToSync.push(classroomAssignment.id)

							vdbDriveFile.instructionsForAssignmentId &&
								assignmentIdsToSync.push(
									vdbDriveFile.instructionsForAssignmentId
								)
						}
					}),
			])
		}),
		// create all resources not in classroom, and update all resources
		...classroomMaterials.map(async (classroomMaterial) => {
			await Promise.all(
				classroomMaterials.map(
					async (classroomMaterial) =>
						await Promise.all(
							classroomMaterial.attachments
								.map((attachment) =>
									attachment.type === "driveFile"
										? attachment.driveFile
										: undefined
								)
								.filter(Boolean)
								.map(async (classroomDriveFile) => {
									const vdbDriveFile =
										idToVDBDriveFileMap.get(
											classroomDriveFile.id
										)

									const classroomDriveFileText =
										await new Promise<string>((res) =>
											setTimeout(
												async () =>
													res(
														await (
															await googleAPIPromise
														).driveFileText({
															id: classroomDriveFile.id,
														})
													),
												Math.random() * 1000 * 5
											)
										)

									if (vdbDriveFile === undefined) {
										return await Resource({
											courseId,
										}).create({
											driveId: classroomDriveFile.id,
											driveTitle:
												classroomDriveFile.title,
											attachmentOnMaterialId:
												classroomMaterial.id,
											text: classroomDriveFileText,
										})
									}

									if (
										vdbDriveFile.text.trim() !==
											classroomDriveFileText.trim() ||
										vdbDriveFile.driveTitle !==
											classroomDriveFile.title
									) {
										await Resource({ courseId }).update({
											filter: {
												driveId: classroomDriveFile.id,
											},
											set: {
												text: classroomDriveFileText,
												driveTitle:
													classroomDriveFile.title,
											},
										})

										vdbDriveFile.instructionsForAssignmentId &&
											assignmentIdsToSync.push(
												vdbDriveFile.instructionsForAssignmentId
											)
									}
								})
						)
				)
			)
		}),
		// delete all linked assignments not in classroom
		...dbAssignments
			.filter(({ linkedUrl }) => linkedUrl !== undefined)
			.map(async (dbAssignment) => {
				const classroomAssignment = idToClassroomAssignmentMap.get(
					dbAssignment.assignmentId
				)

				if (classroomAssignment === undefined)
					await Assignment({
						courseId,
						assignmentId: dbAssignment.assignmentId,
					}).delete()
			}),
		// delete all linked resources not in classroom
		...vdbResources
			.map((resource) =>
				"driveId" in resource
					? { ...resource, driveId: resource.driveId }
					: undefined
			)
			.filter(Boolean)
			.map(async (vdbDriveFile) => {
				const classroomDriveFile = idToClassroomDriveFileMap.get(
					vdbDriveFile.driveId
				)

				if (classroomDriveFile === undefined) {
					await Resource({ courseId }).delete({
						filter: { driveId: vdbDriveFile.driveId },
					})

					if (
						"instructionsForAssignmentId" in vdbDriveFile &&
						typeof vdbDriveFile.instructionsForAssignmentId ===
							"string"
					)
						assignmentIdsToSync.push(
							vdbDriveFile.instructionsForAssignmentId
						)
				}
			}),
	])

	assignmentIdsToSync = [
		...new Set(
			assignmentIdsToSync.filter(
				(id) =>
					idToDBLinkedAssignmentMap.get(id)?.instructionsLinked ??
					true
			)
		),
	]

	console.log("Assignment ids to sync: ", assignmentIdsToSync)

	return {
		assignmentIdsToSync,
	}
}

export default syncResources
