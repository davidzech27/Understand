import { z } from "zod"

import { getCredentialsFromRefreshToken } from "./credentials"

const profileSchema = z.object({
	email: z.string().email(),
	name: z.string(),
	photo: z.string().url().optional(),
})

const courseSchema = z.object({
	id: z.string(),
	name: z.string(),
	section: z.string().optional(),
	url: z.string().url(),
})

const teacherSchema = z.object({
	email: z.string().optional(),
	name: z.string(),
	photo: z.string().optional(),
})

const studentSchema = z.object({
	email: z.string(),
	name: z.string(),
	photo: z.string().optional(),
})

const rosterSchema = z.object({
	teachers: teacherSchema.array(),
	students: studentSchema.array(),
})

const attachmentSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("driveFile"),
		driveFile: z.object({
			id: z.string(),
			title: z.string().optional(),
			url: z.string().url(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
	z.object({
		type: z.literal("youtubeVideo"),
		youtubeVideo: z.object({
			id: z.string(),
			title: z.string().optional(),
			url: z.string().url(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
	z.object({
		type: z.literal("link"),
		link: z.object({
			url: z.string().url(),
			title: z.string().optional(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
	z.object({
		type: z.literal("form"),
		form: z.object({
			formUrl: z.string().url(),
			responseUrl: z.string().url().optional(),
			title: z.string().optional(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
])

const assignmentSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().optional(),
	attachments: attachmentSchema.array(),
	dueAt: z.date().optional(),
	url: z.string().url(),
})

const materialSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().optional(),
	attachments: attachmentSchema.array(),
	dueAt: z.date().optional(),
	url: z.string().url(),
})

const studentSubmissionAttachmentSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("driveFile"),
		driveFile: z.object({
			id: z.string(),
			title: z.string().optional(),
			url: z.string().url(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
	z.object({
		type: z.literal("youtubeVideo"),
		youtubeVideo: z.object({
			id: z.string(),
			title: z.string().optional(),
			url: z.string().url(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
	z.object({
		type: z.literal("link"),
		link: z.object({
			url: z.string().url(),
			title: z.string().optional(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
	z.object({
		type: z.literal("form"),
		form: z.object({
			formUrl: z.string().url(),
			responseUrl: z.string().url().optional(),
			title: z.string().optional(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
])

const utcToLocal = (utc: Date) => new Date(`${utc.toString()} UTC`)

export default async function GoogleAPI({
	refreshToken,
}: {
	refreshToken: string
}) {
	const accessToken = (await getCredentialsFromRefreshToken(refreshToken))
		.accessToken

	return {
		me: async () => {
			const { emailAddresses, names, photos } = (await (
				await fetch(
					"https://people.googleapis.com/v1/people/me?personFields=emailAddresses,names,photos",
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as {
				emailAddresses?: { value: string }[]
				names?: { displayName: string }[]
				photos?: { url: string }[]
			}

			const email = emailAddresses?.[0]?.value

			const name = names?.[0]?.displayName

			const photo = photos?.[0]?.url

			return profileSchema.parse({ email, name, photo })
		},
		coursesTeaching: async (
			{ includeArchived }: { includeArchived: boolean } = {
				includeArchived: false,
			}
		) => {
			type Response = {
				courses: (unknown & { alternateLink: unknown })[] | undefined
				nextPageToken: string | undefined
			}

			const response = (await (
				await fetch(
					`https://classroom.googleapis.com/v1/courses?teacherId=me&courseStates=ACTIVE${
						includeArchived ? ",ARCHIVED" : ""
					}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as Response

			const { courses } = response

			let { nextPageToken } = response

			while (nextPageToken !== undefined) {
				const response = (await (
					await fetch(
						`https://classroom.googleapis.com/v1/courses?teacherId=me&courseStates=ACTIVE${
							includeArchived ? ",ARCHIVED" : ""
						}&pageToken=${nextPageToken}`,
						{
							headers: {
								Authorization: `Bearer ${accessToken}`,
							},
						}
					)
				).json()) as Response

				courses?.push(...(response?.courses ?? []))

				nextPageToken = response.nextPageToken
			}

			return courseSchema.array().parse(
				(courses ?? []).map((course) => ({
					...course,
					url: course.alternateLink,
				}))
			)
		},
		coursesEnrolled: async (
			{ includeArchived }: { includeArchived: boolean } = {
				includeArchived: false,
			}
		) => {
			type Response = {
				courses:
					| (unknown & {
							alternateLink: unknown
					  })[]
					| undefined
				nextPageToken: string | undefined
			}

			const response = (await (
				await fetch(
					`https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE${
						includeArchived ? ",ARCHIVED" : ""
					}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as Response

			const { courses } = response

			let { nextPageToken } = response

			while (nextPageToken !== undefined) {
				const response = (await (
					await fetch(
						`https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE${
							includeArchived ? ",ARCHIVED" : ""
						}&pageToken=${nextPageToken}`,
						{
							headers: {
								Authorization: `Bearer ${accessToken}`,
							},
						}
					)
				).json()) as Response

				courses?.push(...(response?.courses ?? []))

				nextPageToken = response.nextPageToken
			}

			return courseSchema.array().parse(
				(courses ?? []).map((course) => ({
					...course,
					url: course.alternateLink,
				}))
			)
		},
		courseRoster: async ({ courseId }: { courseId: string }) => {
			type TeachersResponse = {
				teachers:
					| {
							profile: {
								emailAddress?: string
								name: { fullName: string }
								photoUrl: string
							}
					  }[]
					| undefined
				nextPageToken: string | undefined
			}

			type StudentsResponse = {
				students:
					| {
							profile: {
								emailAddress: string
								name: { fullName: string }
								photoUrl: string
							}
					  }[]
					| undefined
				nextPageToken: string | undefined
			}

			const [responseTeachers, responseStudents] = (await Promise.all([
				fetch(
					`https://classroom.googleapis.com/v1/courses/${courseId}/teachers`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				).then((response) => response.json()),
				fetch(
					`https://classroom.googleapis.com/v1/courses/${courseId}/students`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				).then((response) => response.json()),
			])) as [TeachersResponse, StudentsResponse]

			const { teachers } = responseTeachers

			let { nextPageToken: nextPageTokenTeachers } = responseTeachers

			const { students } = responseStudents

			let { nextPageToken: nextPageTokenStudents } = responseStudents

			await Promise.all([
				(async () => {
					while (nextPageTokenTeachers !== undefined) {
						const response = (await fetch(
							`https://classroom.googleapis.com/v1/courses/${courseId}/teachers?pageToken=${nextPageTokenTeachers}`,
							{
								headers: {
									Authorization: `Bearer ${accessToken}`,
								},
							}
						).then((response) =>
							response.json()
						)) as TeachersResponse

						teachers?.push(...(response.teachers ?? []))

						nextPageTokenTeachers = response.nextPageToken
					}
				})(),
				(async () => {
					while (nextPageTokenStudents !== undefined) {
						const response = (await fetch(
							`https://classroom.googleapis.com/v1/courses/${courseId}/students?pageToken=${nextPageTokenStudents}`,
							{
								headers: {
									Authorization: `Bearer ${accessToken}`,
								},
							}
						).then((response) =>
							response.json()
						)) as StudentsResponse

						students?.push(...(response.students ?? []))

						nextPageTokenStudents = response.nextPageToken
					}
				})(),
			])

			return rosterSchema.parse({
				teachers: (teachers ?? []).map((teacher) => ({
					email: teacher.profile.emailAddress,
					name: teacher.profile.name.fullName,
					photo: teacher.profile.photoUrl,
				})),
				students: (students ?? []).map((student) => ({
					email: student.profile.emailAddress,
					name: student.profile.name.fullName,
					photo: student.profile.photoUrl,
				})),
			})
		},
		courseAssignments: async ({ courseId }: { courseId: string }) => {
			type Response = {
				courseWork:
					| {
							id: unknown
							title: unknown
							description: unknown
							materials:
								| {
										driveFile:
											| {
													driveFile: {
														id: unknown
														title: unknown
														alternateLink: unknown
														thumbnailUrl: unknown
													}
											  }
											| undefined
										youtubeVideo:
											| {
													id: unknown
													title: unknown
													alternateLink: unknown
													thumbnailUrl: unknown
											  }
											| undefined
										link:
											| {
													title: unknown
													url: unknown
													thumbnailUrl: unknown
											  }
											| undefined
										form:
											| {
													title: unknown
													formUrl: unknown
													responseUrl: unknown
													thumbnailUrl: unknown
											  }
											| undefined
								  }[]
								| undefined
							dueDate:
								| { year: number; month: number; day: number }
								| undefined
							dueTime:
								| { hours: number; minutes: number }
								| undefined
							workType: unknown
							alternateLink: unknown
					  }[]
					| undefined
				nextPageToken: string | undefined
			}

			const response = (await (
				await fetch(
					`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?orderBy=updateTime%20asc`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as Response

			const { courseWork } = response

			let { nextPageToken } = response

			while (nextPageToken !== undefined) {
				const response = (await (
					await fetch(
						`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?orderBy=updateTime%20asc&pageToken=${nextPageToken}`,
						{
							headers: {
								Authorization: `Bearer ${accessToken}`,
							},
						}
					)
				).json()) as Response

				courseWork?.push(...(response?.courseWork ?? []))

				nextPageToken = response.nextPageToken
			}

			const assignments = (courseWork ?? [])
				.map(
					({
						id,
						title,
						description,
						materials,
						dueDate,
						dueTime,
						workType,
						alternateLink,
					}) =>
						workType === "ASSIGNMENT"
							? {
									id,
									title,
									description,
									url: alternateLink,
									attachments: (materials ?? []).map(
										({
											driveFile,
											youtubeVideo,
											link,
											form,
										}) => {
											if (driveFile)
												return {
													type: "driveFile",
													driveFile: {
														id: driveFile.driveFile
															?.id,
														title: driveFile
															.driveFile?.title,
														url: driveFile.driveFile
															?.alternateLink,
														thumbnailUrl:
															driveFile.driveFile
																?.thumbnailUrl,
													},
												}
											if (youtubeVideo)
												return {
													type: "youtubeVideo",
													youtubeVideo: {
														id: youtubeVideo.id,
														title: youtubeVideo.title,
														url: youtubeVideo.alternateLink,
														thumbnailUrl:
															youtubeVideo.thumbnailUrl,
													},
												}
											if (link)
												return {
													type: "link",
													link: {
														title: link.title,
														url: link.url,
														thumbnailUrl:
															link.thumbnailUrl,
													},
												}
											if (form)
												return {
													type: "form",
													form: {
														title: form.title,
														formUrl: form.formUrl,
														responseUrl:
															form.responseUrl,
														thumbnailUrl:
															form.thumbnailUrl,
													},
												}
										}
									),
									dueAt: (() => {
										const date =
											dueDate &&
											dueDate.year &&
											dueDate.month &&
											dueDate.day &&
											dueTime &&
											dueTime.hours &&
											dueTime.minutes
												? utcToLocal(
														new Date(
															dueDate.year,
															dueDate.month - 1,
															dueDate.day,
															dueTime.hours,
															dueTime.minutes
														)
												  )
												: undefined

										return date
									})(),
							  }
							: undefined
				)
				.filter(Boolean)

			return assignmentSchema.array().parse(assignments)
		},
		assignment: async ({
			courseId,
			assignmentId,
		}: {
			courseId: string
			assignmentId: string
		}) => {
			type Response =
				| {
						id: unknown
						title: unknown
						description: unknown
						materials:
							| {
									driveFile:
										| {
												driveFile: {
													id: unknown
													title: unknown
													alternateLink: unknown
													thumbnailUrl: unknown
												}
										  }
										| undefined
									youtubeVideo:
										| {
												id: unknown
												title: unknown
												alternateLink: unknown
												thumbnailUrl: unknown
										  }
										| undefined
									link:
										| {
												title: unknown
												url: unknown
												thumbnailUrl: unknown
										  }
										| undefined
									form:
										| {
												title: unknown
												formUrl: unknown
												responseUrl: unknown
												thumbnailUrl: unknown
										  }
										| undefined
							  }[]
							| undefined
						dueDate:
							| { year: number; month: number; day: number }
							| undefined
						dueTime: { hours: number; minutes: number } | undefined
						workType: unknown
						alternateLink: unknown
				  }
				| undefined

			const response = (await (
				await fetch(
					`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${assignmentId}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as Response

			if (response === undefined) return undefined

			const {
				id,
				title,
				description,
				alternateLink,
				materials,
				dueDate,
				dueTime,
			} = response

			return assignmentSchema.parse({
				id,
				title,
				description,
				url: alternateLink,
				attachments: (materials ?? []).map(
					({ driveFile, youtubeVideo, link, form }) => {
						if (driveFile)
							return {
								type: "driveFile",
								driveFile: {
									id: driveFile.driveFile?.id,
									title: driveFile.driveFile?.title,
									url: driveFile.driveFile?.alternateLink,
									thumbnailUrl:
										driveFile.driveFile?.thumbnailUrl,
								},
							}
						if (youtubeVideo)
							return {
								type: "youtubeVideo",
								youtubeVideo: {
									id: youtubeVideo.id,
									title: youtubeVideo.title,
									url: youtubeVideo.alternateLink,
									thumbnailUrl: youtubeVideo.thumbnailUrl,
								},
							}
						if (link)
							return {
								type: "link",
								link: {
									title: link.title,
									url: link.url,
									thumbnailUrl: link.thumbnailUrl,
								},
							}
						if (form)
							return {
								type: "form",
								form: {
									title: form.title,
									formUrl: form.formUrl,
									responseUrl: form.responseUrl,
									thumbnailUrl: form.thumbnailUrl,
								},
							}
					}
				),
				dueAt: (() => {
					const date =
						dueDate &&
						dueDate.year &&
						dueDate.month &&
						dueDate.day &&
						dueTime &&
						dueTime.hours &&
						dueTime.minutes
							? utcToLocal(
									new Date(
										dueDate.year,
										dueDate.month - 1,
										dueDate.day,
										dueTime.hours,
										dueTime.minutes
									)
							  )
							: undefined

					return date
				})(),
			})
		},
		courseMaterials: async ({ courseId }: { courseId: string }) => {
			type Response = {
				courseWorkMaterial:
					| {
							id: unknown
							title: unknown
							description: unknown
							materials:
								| {
										driveFile:
											| {
													driveFile: {
														id: unknown
														title: unknown
														alternateLink: unknown
														thumbnailUrl: unknown
													}
											  }
											| undefined
										youtubeVideo:
											| {
													id: unknown
													title: unknown
													alternateLink: unknown
													thumbnailUrl: unknown
											  }
											| undefined
										link:
											| {
													title: unknown
													url: unknown
													thumbnailUrl: unknown
											  }
											| undefined
										form:
											| {
													title: unknown
													formUrl: unknown
													responseUrl: unknown
													thumbnailUrl: unknown
											  }
											| undefined
								  }[]
								| undefined
							dueDate:
								| {
										year: number
										month: number
										day: number
								  }
								| undefined
							dueTime:
								| { hours: number; minutes: number }
								| undefined
							alternateLink: unknown
					  }[]
					| undefined
				nextPageToken: string | undefined
			}

			const response = (await (
				await fetch(
					`https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials?orderBy=updateTime%20asc`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as Response

			const { courseWorkMaterial } = response

			let { nextPageToken } = response

			while (nextPageToken !== undefined) {
				const response = (await (
					await fetch(
						`https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials?orderBy=updateTime%20asc&pageToken=${nextPageToken}`,
						{
							headers: {
								Authorization: `Bearer ${accessToken}`,
							},
						}
					)
				).json()) as Response

				courseWorkMaterial?.push(
					...(response?.courseWorkMaterial ?? [])
				)

				nextPageToken = response.nextPageToken
			}

			const courseWorkMaterialTransformed = (
				courseWorkMaterial ?? []
			).map(
				({
					id,
					title,
					description,
					materials,
					dueDate,
					dueTime,
					alternateLink,
				}) => ({
					id,
					title,
					description,
					url: alternateLink,
					attachments: (materials ?? []).map(
						({ driveFile, youtubeVideo, link, form }) => {
							if (driveFile)
								return {
									type: "driveFile",
									driveFile: {
										id: driveFile.driveFile?.id,
										title: driveFile.driveFile?.title,
										url: driveFile.driveFile?.alternateLink,
										thumbnailUrl:
											driveFile.driveFile?.thumbnailUrl,
									},
								}
							if (youtubeVideo)
								return {
									type: "youtubeVideo",
									youtubeVideo: {
										id: youtubeVideo.id,
										title: youtubeVideo.title,
										url: youtubeVideo.alternateLink,
										thumbnailUrl: youtubeVideo.thumbnailUrl,
									},
								}
							if (link)
								return {
									type: "link",
									link: {
										title: link.title,
										url: link.url,
										thumbnailUrl: link.thumbnailUrl,
									},
								}
							if (form)
								return {
									type: "form",
									form: {
										title: form.title,
										formUrl: form.formUrl,
										responseUrl: form.responseUrl,
										thumbnailUrl: form.thumbnailUrl,
									},
								}
						}
					),
					dueAt: (() => {
						return dueDate &&
							dueDate.year &&
							dueDate.month &&
							dueDate.day &&
							dueTime &&
							dueTime.hours &&
							dueTime.minutes
							? utcToLocal(
									new Date(
										dueDate.year,
										dueDate.month - 1,
										dueDate.day,
										dueTime.hours,
										dueTime.minutes
									)
							  )
							: undefined
					})(),
				})
			)

			return materialSchema.array().parse(courseWorkMaterialTransformed)
		},
		studentSubmissions: async ({
			courseId,
			assignmentId,
			email,
		}: {
			courseId: string
			assignmentId: string
			email?: string
		}) => {
			type Response = {
				studentSubmissions:
					| {
							assignmentSubmission:
								| {
										attachments:
											| {
													driveFile:
														| {
																id: unknown
																title: unknown
																alternateLink: unknown
																thumbnailUrl: unknown
														  }
														| undefined
													youTubeVideo:
														| {
																id: unknown
																title: unknown
																alternateLink: unknown
																thumbnailUrl: unknown
														  }
														| undefined
													link:
														| {
																title: unknown
																url: unknown
																thumbnailUrl: unknown
														  }
														| undefined
													form:
														| {
																title: unknown
																formUrl: unknown
																responseUrl: unknown
																thumbnailUrl: unknown
														  }
														| undefined
											  }[]
											| undefined
								  }
								| undefined
					  }[]
					| undefined
				nextPageToken: string | undefined
			}

			const response = (await (
				await fetch(
					`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${assignmentId}/studentSubmissions${
						email !== undefined ? `?userId=${email}` : ""
					}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as Response

			const { studentSubmissions } = response

			let { nextPageToken } = response

			while (nextPageToken !== undefined) {
				const response = (await (
					await fetch(
						`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${assignmentId}/studentSubmissions?${
							email !== undefined ? `userId=${email}&` : ""
						}pageToken=${nextPageToken}`,
						{
							headers: {
								Authorization: `Bearer ${accessToken}`,
							},
						}
					)
				).json()) as Response

				studentSubmissions?.push(
					...(response?.studentSubmissions ?? [])
				)

				nextPageToken = response.nextPageToken
			}

			const studentSubmissionsTransformed = (studentSubmissions ?? [])
				.map(({ assignmentSubmission }) =>
					assignmentSubmission !== undefined
						? (assignmentSubmission.attachments ?? []).map(
								({ driveFile, youTubeVideo, link, form }) => {
									if (driveFile)
										return {
											type: "driveFile",
											driveFile: {
												id: driveFile.id,
												title: driveFile.title,
												url: driveFile.alternateLink,
												thumbnailUrl:
													driveFile.thumbnailUrl,
											},
										}
									if (youTubeVideo)
										return {
											type: "youtubeVideo",
											youtubeVideo: {
												id: youTubeVideo.id,
												title: youTubeVideo.title,
												url: youTubeVideo.alternateLink,
												thumbnailUrl:
													youTubeVideo.thumbnailUrl,
											},
										}
									if (link)
										return {
											type: "link",
											link: {
												title: link.title,
												url: link.url,
												thumbnailUrl: link.thumbnailUrl,
											},
										}
									if (form)
										return {
											type: "form",
											form: {
												title: form.title,
												formUrl: form.formUrl,
												responseUrl: form.responseUrl,
												thumbnailUrl: form.thumbnailUrl,
											},
										}
								}
						  )
						: undefined
				)
				.flat()
				.filter(Boolean)

			return studentSubmissionAttachmentSchema
				.array()
				.parse(studentSubmissionsTransformed)
		},
		driveFileText: async ({ id }: { id: string }) => {
			return await (
				await fetch(
					`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text%2Fplain`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).text()
		},
		driveFileHTML: async ({ id }: { id: string }) => {
			return await (
				await fetch(
					`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text%2Fhtml`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).text()
		},
	}
}
