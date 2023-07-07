import { desc, eq, and, lt, inArray, isNotNull } from "drizzle-orm"
import { z } from "zod"

import vdbPromise from "~/db/vdb"
import getEmbedding from "~/ai/getEmbedding"

import db from "~/db/db"
import {
	user,
	course,
	studentToCourse,
	teacherToCourse,
	assignment,
	feedback,
	followUp,
	studentInsight,
	assignmentInsight,
} from "~/db/schema"
import { insightsSchema } from "./Feedback"

const resourceMetadataSchema = z.intersection(
	z.object({
		text: z.string(),
	}),
	z.union([
		z.intersection(
			z.object({
				driveId: z.string(),
				driveTitle: z.string().optional(),
				instructionsForAssignmentId: z.string().optional(),
			}),
			z.union([
				z.object({
					attachmentOnAssignmentId: z.string(),
				}),
				z.object({
					attachmentOnMaterialId: z.string(),
				}),
			])
		),
		z.object({
			instructionsForAssignmentId: z.string(),
		}),
	])
)

type Resource = z.infer<typeof resourceMetadataSchema>

const messageMetadataSchema = z.object({
	fromEmail: z.string(),
	content: z.string(),
	sentAt: z.date(),
})

const getFormattedResourceText = (resource: Resource) =>
	`${
		"instructionsForAssignmentTitle" in resource
			? `Instructions for assignment title: ${resource.instructionsForAssignmentTitle}\n\n`
			: "attachmentOnAssignmentTitle" in resource
			? `Attachment on assignment title: ${resource.attachmentOnAssignmentTitle}\n\n`
			: "attachmentOnMaterialTitle" in resource
			? `Attachment on material title: ${resource.attachmentOnMaterialTitle}\n\n`
			: ""
	}${
		"driveTitle" in resource
			? `Document title: ${resource.driveTitle}\n\n`
			: ""
	}Content: ${resource.text}`

const Course = ({ id }: { id: string }) => ({
	create: async ({
		name,
		section,
		linkedUrl,
		linkedRefreshToken,
	}: {
		name: string
		section: string | undefined
		linkedUrl: string | undefined
		linkedRefreshToken: string | undefined
	}) => {
		await db.insert(course).values({
			id,
			name,
			section,
			linkedUrl,
			linkedRefreshToken,
		})
	},
	get: async () => {
		const row = (
			await db
				.select({
					linkedUrl: course.linkedUrl, // I have no idea why but this query fails when linkedUrl is last column
					name: course.name,
					section: course.section,
				})
				.from(course)
				.where(eq(course.id, id))
		)[0]

		if (!row) return undefined

		return {
			id,
			name: row.name,
			section: row.section ?? undefined,
			linkedUrl: row.linkedUrl ?? undefined,
		}
	},
	update: async ({
		name,
		section,
		googleClassroomId,
		linkedRefreshToken,
	}: {
		name?: string
		section?: string | null
		googleClassroomId?: string
		linkedRefreshToken?: string
	}) => {
		await db
			.update(course)
			.set({
				...(name !== undefined ? { name } : {}),
				...(section !== undefined ? { section } : {}),
				...(googleClassroomId !== undefined
					? { googleClassroomId }
					: {}),
				...(linkedRefreshToken !== undefined
					? { linkedRefreshToken }
					: {}),
			})
			.where(eq(course.id, id))
	},
	delete: async () => {
		await Promise.all([
			db.delete(course).where(eq(course.id, id)),
			db.delete(teacherToCourse).where(eq(teacherToCourse.courseId, id)),
			db.delete(studentToCourse).where(eq(studentToCourse.courseId, id)),
			db.delete(assignment).where(eq(assignment.courseId, id)),
			db.delete(feedback).where(eq(feedback.courseId, id)),
			db.delete(followUp).where(eq(followUp.courseId, id)),
			vdbPromise.then((vdb) =>
				vdb.delete1({
					deleteAll: true,
					namespace: `resource:${id}`,
				})
			),
			db.delete(studentInsight).where(eq(studentInsight.courseId, id)),
			db
				.delete(assignmentInsight)
				.where(eq(assignmentInsight.courseId, id)),
		])
	},
	linkedRefreshToken: async () => {
		return (
			(
				await db
					.select({
						linkedRefreshToken: course.linkedRefreshToken,
					})
					.from(course)
					.where(eq(course.id, id))
			)[0]?.linkedRefreshToken ?? undefined
		)
	},
	roster: async () => {
		const [teachers, students] = await Promise.all([
			db
				.select({
					email: teacherToCourse.teacherEmail,
					name: user.name,
					photo: user.photo,
					linked: teacherToCourse.linked,
				})
				.from(teacherToCourse)
				.leftJoin(user, eq(user.email, teacherToCourse.teacherEmail))
				.where(eq(teacherToCourse.courseId, id)),
			db
				.select({
					email: studentToCourse.studentEmail,
					name: user.name,
					photo: user.photo,
					linked: studentToCourse.linked,
				})
				.from(studentToCourse)
				.leftJoin(user, eq(user.email, studentToCourse.studentEmail))
				.where(eq(studentToCourse.courseId, id)),
		])

		return {
			teachers: teachers.map((teacher) =>
				teacher.name !== null
					? {
							signedUp: true as const,
							email: teacher.email,
							name: teacher.name,
							photo: teacher.photo ?? undefined,
							linked: teacher.linked ?? false,
					  }
					: { signedUp: false as const, email: teacher.email }
			),
			students: students.map((student) =>
				student.name !== null
					? {
							signedUp: true as const,
							email: student.email,
							name: student.name,
							photo: student.photo ?? undefined,
							linked: student.linked ?? false,
					  }
					: { signedUp: false as const, email: student.email }
			),
		}
	},
	assignments: async () => {
		const assignments = await db
			.select()
			.from(assignment)
			.where(eq(assignment.courseId, id))
			.orderBy(desc(assignment.dueAt))

		return assignments.map((assignment) => ({
			courseId: assignment.courseId,
			assignmentId: assignment.assignmentId,
			title: assignment.title,
			description: assignment.description ?? undefined,
			instructions: assignment.instructions ?? undefined,
			context: assignment.context ?? undefined,
			dueAt:
				(assignment.dueAt &&
					new Date(
						Date.UTC(
							assignment.dueAt.getFullYear(),
							assignment.dueAt.getMonth(),
							assignment.dueAt.getDate(),
							assignment.dueAt.getHours(),
							assignment.dueAt.getMinutes()
						)
					)) ??
				undefined,
			linkedUrl: assignment.linkedUrl ?? undefined,
			instructionsLinked: assignment.instructionsLinked ?? false,
		}))
	},
	feedbackHistory: async ({
		limit,
		cursor,
	}: {
		limit: number
		cursor?: number
	}) => {
		const feedbackHistory = (
			await db
				.select({
					assignmentId: assignment.assignmentId,
					assignmentTitle: assignment.title,
					userEmail: user.email,
					userName: user.name,
					userPhoto: user.photo,
					givenAt: feedback.givenAt,
				})
				.from(feedback)
				.where(
					cursor === undefined
						? eq(feedback.courseId, id)
						: and(
								eq(feedback.courseId, id),
								lt(feedback.givenAt, new Date(cursor))
						  )
				)
				.orderBy(desc(feedback.givenAt))
				.limit(limit)
				.innerJoin(user, eq(user.email, feedback.userEmail))
				.innerJoin(
					assignment,
					and(
						eq(assignment.courseId, id),
						eq(assignment.assignmentId, feedback.assignmentId)
					)
				)
		).map(({ givenAt, userPhoto, ...feedback }) => ({
			...feedback,
			givenAt: new Date(
				Date.UTC(
					givenAt.getFullYear(),
					givenAt.getMonth(),
					givenAt.getDate(),
					givenAt.getHours(),
					givenAt.getMinutes(),
					givenAt.getSeconds(),
					givenAt.getMilliseconds()
				)
			),
			userPhoto: userPhoto ?? undefined,
		}))

		return {
			feedbackHistory,
			cursor:
				feedbackHistory.length === limit
					? feedbackHistory.at(-1)?.givenAt.valueOf()
					: undefined,
		}
	},
	unsyncedInsights: async () => {
		return (
			await db
				.select({
					assignmentId: feedback.assignmentId,
					studentEmail: feedback.userEmail,
					insights: feedback.insights,
				})
				.from(feedback)
				.where(
					and(
						eq(feedback.courseId, id),
						eq(feedback.synced, false),
						isNotNull(feedback.insights)
					)
				)
		).map((row) => ({
			...row,
			insights: insightsSchema.parse(row.insights),
		}))
	},
	createResource: async (resource: Resource) => {
		const namespace = `resource:${id}`

		const vdb = await vdbPromise

		vdb.upsert({
			upsertRequest: {
				vectors: [
					{
						id: `resource:${id}:${
							"driveId" in resource
								? "drive"
								: "instructionsForAssignmentId" in resource
								? "description" // outdated, because now non-synced resources are indexed as well
								: ""
						}:${
							"driveId" in resource
								? resource.driveId
								: "instructionsForAssignmentId" in resource
								? resource.instructionsForAssignmentId
								: ""
						}`,
						values: await getEmbedding(
							getFormattedResourceText(resource)
						),
						metadata: resource,
					},
				],
				namespace,
			},
		})
	},
	getResources: async ({ filter }: { filter: object }) => {
		const namespace = `resource:${id}`

		const vdb = await vdbPromise

		return (
			(
				await vdb.query({
					queryRequest: {
						vector: Array(1536).fill(0),
						filter:
							Object.keys(filter).length === 0
								? undefined
								: filter,
						topK: 10_000,
						includeMetadata: true,
						namespace,
					},
				})
			).matches ?? []
		).map((match) => resourceMetadataSchema.parse(match.metadata))
	},
	searchResources: async ({
		similarText,
		filter,
		topK,
	}: {
		similarText: string
		filter: object
		topK: number
	}) => {
		const namespace = `resource:${id}`

		const vdb = await vdbPromise

		return (
			(
				await vdb.query({
					queryRequest: {
						vector: await getEmbedding(similarText),
						filter:
							Object.keys(filter).length === 0
								? undefined
								: filter,
						topK,
						includeMetadata: true,
						namespace,
					},
				})
			).matches ?? []
		).map((match) => resourceMetadataSchema.parse(match.metadata))
	},
	updateResources: async ({
		set,
		filter,
	}: {
		set: Partial<Resource>
		filter: object
	}) => {
		const namespace = `resource:${id}`

		const [vdb, values] = await Promise.all([
			vdbPromise,
			set.text !== undefined ? await getEmbedding(set.text) : undefined,
		])

		await Promise.all(
			(
				(
					await vdb.query({
						queryRequest: {
							vector: Array(1536).fill(0),
							filter:
								Object.keys(filter).length === 0
									? undefined
									: filter,
							topK: 10_000,
							namespace,
						},
					})
				).matches ?? []
			).map(({ id }) =>
				vdb.update({
					updateRequest: {
						id,
						...(values !== undefined ? { values } : {}),
						setMetadata: set,
						namespace,
					},
				})
			)
		)
	},
	deleteResources: async ({ filter }: { filter: object }) => {
		const namespace = `resource:${id}`

		const vdb = await vdbPromise

		if (Object.keys(filter).length === 0) {
			await vdb.delete1({
				deleteAll: true,
				namespace,
			})
		} else {
			const ids = (
				await vdb.query({
					queryRequest: {
						vector: Array(1536).fill(0),
						filter,
						topK: 10_000,
						namespace,
					},
				})
			).matches?.map(({ id }) => id)

			if (ids === undefined) return

			await vdb.delete1({
				ids,
			})
		}
	},
	hasResources: async () => {
		const namespace = `resource:${id}`

		const vdb = await vdbPromise

		return (
			(
				await vdb.query({
					queryRequest: {
						vector: Array(1536).fill(0),
						topK: 1,
						namespace,
					},
				})
			).matches?.length === 1
		)
	},
	createMessage: async ({
		fromEmail,
		content,
	}: {
		fromEmail: string
		content: string
	}) => {
		const namespace = `message:${id}`

		const sentAt = new Date()

		const [vdb, values] = await Promise.all([
			vdbPromise,
			getEmbedding(content),
		])

		await vdb.upsert({
			upsertRequest: {
				vectors: [
					{
						id: `message:${id}:${fromEmail}:${sentAt.valueOf()}`,
						values,
						metadata: {
							fromEmail,
							content,
							sentAt: sentAt.valueOf(),
						},
					},
				],
				namespace,
			},
		})

		return {
			sentAt,
		}
	},
	// consider including score
	getSimilarMessages: async ({
		content,
		limit,
	}: {
		content: string
		limit: number
	}) => {
		const namespace = `message:${id}`

		const vdb = await vdbPromise

		const { matches } = await vdb.query({
			queryRequest: {
				vector: await getEmbedding(content),
				topK: limit,
				includeMetadata: true,
				namespace,
			},
		})

		const messages = (matches ?? [])
			.map(({ metadata }) => {
				if (
					metadata !== undefined &&
					"sentAt" in metadata &&
					typeof metadata.sentAt === "number"
				) {
					return messageMetadataSchema.parse({
						...metadata,
						sentAt: new Date(metadata.sentAt),
					})
				} else return undefined
			})
			.filter(Boolean)

		const users =
			messages.length !== 0
				? await db
						.select({
							email: user.email,
							name: user.name,
							photo: user.photo,
						})
						.from(user)
						.where(
							inArray(
								user.email,
								messages.map((message) => message.fromEmail)
							)
						)
				: []

		const profileByEmailMap = new Map(
			users.map(({ email, name, photo }) => [
				email,
				{ name, photo: photo ?? undefined },
			])
		)

		return messages
			.map(({ fromEmail, content, sentAt }) => ({
				from: {
					email: fromEmail,
					...profileByEmailMap.get(fromEmail),
				},
				content,
				sentAt,
			}))
			.map(({ from, content, sentAt }) =>
				from.name !== undefined ? { from, content, sentAt } : undefined
			)
			.filter(Boolean)
	},
	deleteMessage: async ({
		fromEmail,
		sentAt,
	}: {
		fromEmail: string
		sentAt: Date
	}) => {
		const vdb = await vdbPromise

		await vdb.delete1({
			ids: [`message:${id}:${fromEmail}:${sentAt.valueOf()}`],
		})
	},
})

export default Course
