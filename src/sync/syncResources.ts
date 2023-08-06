import Assignment from "~/data/Assignment"
import Course from "~/data/Course"
import GoogleAPI from "~/google/GoogleAPI"

export default async function syncResources({
	courseId,
}: {
	courseId: string
}) {
	const googleAPIPromise = Course({ id: courseId })
		.syncedRefreshToken()
		.then((refreshToken) => {
			if (refreshToken === undefined)
				throw new Error(
					"Synced refresh token could not be found for course"
				)

			return GoogleAPI({ refreshToken })
		})

	const [
		dbAssignments,
		vdbResources,
		[classroomAssignments, classroomMaterials],
	] = await Promise.all([
		Course({ id: courseId }).assignments(),
		Course({ id: courseId }).getResources({ filter: {} }),
		googleAPIPromise.then((googleAPI) =>
			Promise.all([
				googleAPI.courseAssignments({ courseId }),
				googleAPI.courseMaterials({ courseId }),
			])
		),
	])

	const idToDBSyncedAssignmentMap = new Map(
		dbAssignments
			.map((assignment) =>
				assignment.syncedUrl !== undefined
					? { ...assignment, syncedUrl: assignment.syncedUrl }
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
		// create all assignments and index attachments on them not in classroom, and update all synced assignments and resources
		...classroomAssignments.map(async (classroomAssignment) => {
			const dbSyncedAssignment = idToDBSyncedAssignmentMap.get(
				classroomAssignment.id
			)

			if (dbSyncedAssignment === undefined) {
				await Promise.all([
					Assignment({
						courseId,
						assignmentId: classroomAssignment.id,
					}).create({
						title: classroomAssignment.title,
						description: classroomAssignment.description,
						dueAt: classroomAssignment.dueAt,
						syncedUrl: classroomAssignment.url,
						instructions: undefined,
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
								await Course({ id: courseId }).createResource({
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
			} else {
				await Promise.all([
					(async () => {
						if (
							dbSyncedAssignment.syncedAt !== undefined &&
							(dbSyncedAssignment.title !==
								classroomAssignment.title ||
								dbSyncedAssignment.description !==
									classroomAssignment.description ||
								dbSyncedAssignment.dueAt?.valueOf() !==
									classroomAssignment.dueAt?.valueOf())
						) {
							await Assignment({
								courseId,
								assignmentId: classroomAssignment.id,
							}).update({
								title:
									dbSyncedAssignment.title !==
									classroomAssignment.title
										? classroomAssignment.title
										: undefined,

								description:
									dbSyncedAssignment.description !==
									classroomAssignment.description
										? classroomAssignment.description ??
										  null
										: undefined,
								dueAt:
									dbSyncedAssignment.dueAt !==
									classroomAssignment.dueAt
										? classroomAssignment.dueAt ?? null
										: undefined,
								syncedAt: new Date(),
							})

							assignmentIdsToSync.push(classroomAssignment.id)
						}
					})(),
					(async () => {
						if (
							dbSyncedAssignment.description !==
							classroomAssignment.description
						) {
							const instructionsOnAssignment =
								vdbResources.filter(
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

								if (
									classroomAssignment.description ===
									undefined
								) {
									return await Course({
										id: courseId,
									}).deleteResources({
										filter: {
											instructionsForAssignmentId:
												classroomAssignment.id,
											driveId: {
												$nin: driveIdsOfInstructionsOnAssignment,
											},
										},
									})
								}

								await Course({
									id: courseId,
								}).updateResources({
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
								await Course({ id: courseId }).createResource({
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
								vdbDriveFile.driveTitle !==
									classroomDriveFile.title
							) {
								await Course({ id: courseId }).updateResources({
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
			}
		}),
		// create all resources not in classroom, and update all resources
		...classroomMaterials.map(
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
								return await Course({
									id: courseId,
								}).createResource({
									driveId: classroomDriveFile.id,
									driveTitle: classroomDriveFile.title,
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
								await Course({
									id: courseId,
								}).updateResources({
									filter: {
										driveId: classroomDriveFile.id,
									},
									set: {
										text: classroomDriveFileText,
										driveTitle: classroomDriveFile.title,
									},
								})

								vdbDriveFile.instructionsForAssignmentId &&
									assignmentIdsToSync.push(
										vdbDriveFile.instructionsForAssignmentId
									)
							}
						})
				)
		),
		// delete all synced assignments not in classroom
		...dbAssignments
			.filter(({ syncedUrl }) => syncedUrl !== undefined)
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
		// delete all synced resources not in classroom
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
					await Course({ id: courseId }).deleteResources({
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
					!(
						idToDBSyncedAssignmentMap.get(id) !== undefined &&
						idToDBSyncedAssignmentMap.get(id)?.syncedAt ===
							undefined
					)
			)
		),
	]

	console.info("Assignment ids to sync: ", assignmentIdsToSync)

	return {
		assignmentIdsToSync,
	}
}
