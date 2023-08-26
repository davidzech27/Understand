import { desc, eq, and, lt, inArray, isNotNull, isNull, sql } from "drizzle-orm"
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
	studentInsight,
	assignmentInsight,
} from "~/db/schema"
import { feedbackInsightsSchema } from "./Feedback"
import User from "./User"

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

export type Course = Exclude<
	Awaited<ReturnType<ReturnType<typeof Course>["get"]>>,
	undefined
>

const Course = ({ id }: { id: string }) => ({
	create: async ({
		name,
		section,
		syncedUrl,
		syncedRefreshToken,
	}: {
		name: string
		section: string | undefined
		syncedUrl: string | undefined
		syncedRefreshToken: string | undefined
	}) => {
		await db.insert(course).values({
			id,
			name,
			section,
			syncedUrl,
			syncedRefreshToken,
		})
	},
	get: async () => {
		const row = (
			await db
				.select({
					name: course.name,
					section: course.section,
					syncedUrl: course.syncedUrl,
				})
				.from(course)
				.where(eq(course.id, id))
		)[0]

		if (!row) return undefined

		return {
			id,
			name: row.name,
			section: row.section ?? undefined,
			syncedUrl: row.syncedUrl ?? undefined,
		}
	},
	update: async ({
		name,
		section,
		syncedRefreshToken,
	}: {
		name?: string
		section?: string | null
		syncedRefreshToken?: string
	}) => {
		await db
			.update(course)
			.set({
				name,
				section,
				syncedRefreshToken,
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
	syncedRefreshToken: async () => {
		return (
			(
				await db
					.select({
						syncedRefreshToken: course.syncedRefreshToken,
					})
					.from(course)
					.where(eq(course.id, id))
			)[0]?.syncedRefreshToken ?? undefined
		)
	},
	teachers: async () => {
		const teachers = await db
			.select({
				email: teacherToCourse.teacherEmail,
				name: user.name,
				photo: user.photo,
				syncedAt: teacherToCourse.syncedAt,
			})
			.from(teacherToCourse)
			.leftJoin(user, eq(user.email, teacherToCourse.teacherEmail))
			.where(eq(teacherToCourse.courseId, id))

		return teachers.map((teacher) =>
			teacher.name !== null
				? {
						signedUp: true as const,
						email: teacher.email,
						name: teacher.name,
						photo: teacher.photo ?? undefined,
						syncedAt: teacher.syncedAt ?? undefined,
				  }
				: { signedUp: false as const, email: teacher.email }
		)
	},
	students: async () => {
		const students = await db
			.select({
				email: studentToCourse.studentEmail,
				name: user.name,
				photo: user.photo,
				syncedAt: studentToCourse.syncedAt,
			})
			.from(studentToCourse)
			.leftJoin(user, eq(user.email, studentToCourse.studentEmail))
			.where(eq(studentToCourse.courseId, id))

		return students.map((student) =>
			student.name !== null
				? {
						signedUp: true as const,
						email: student.email,
						name: student.name,
						photo: student.photo ?? undefined,
						syncedAt: student.syncedAt ?? undefined,
				  }
				: { signedUp: false as const, email: student.email }
		)
	},
	assignments: async () => {
		const assignments = await db
			.select({
				courseId: assignment.courseId,
				assignmentId: assignment.assignmentId,
				title: assignment.title,
				description: assignment.description,
				instructions: assignment.instructions,
				dueAt: assignment.dueAt,
				syncedUrl: assignment.syncedUrl,
				syncedAt: assignment.syncedAt,
			})
			.from(assignment)
			.where(eq(assignment.courseId, id))
			.orderBy(desc(assignment.dueAt), desc(assignment.createdAt))

		return assignments.map((assignment) => ({
			courseId: assignment.courseId,
			assignmentId: assignment.assignmentId,
			title: assignment.title,
			description: assignment.description ?? undefined,
			instructions: assignment.instructions ?? undefined,
			dueAt: assignment.dueAt ?? undefined,
			syncedUrl: assignment.syncedUrl ?? undefined,
			syncedAt: assignment.syncedAt ?? undefined,
		}))
	},
	feedbackStream: async ({
		limit,
		cursor,
	}: {
		limit: number
		cursor?: number
	}) => {
		const feedbackStream = (
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
		).map(({ userPhoto, ...feedback }) => ({
			...feedback,
			userPhoto: userPhoto ?? undefined,
		}))

		return {
			feedbackStream,
			cursor:
				feedbackStream.length === limit
					? feedbackStream.at(-1)?.givenAt.valueOf()
					: undefined,
		}
	},
	unsyncedFeedbackInsights: async () => {
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
						isNull(feedback.syncedInsightsAt),
						isNotNull(feedback.insights)
					)
				)
		).map((row) => ({
			...row,
			insights: feedbackInsightsSchema.parse(row.insights),
		}))
	},
	createResource: async (resource: Resource) => {
		const namespace = `resource:${id}`

		const { embedding, cost } = await getEmbedding(
			getFormattedResourceText(resource)
		)

		const vdb = await vdbPromise

		await Promise.all([
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
							values: embedding,
							metadata: resource,
						},
					],
					namespace,
				},
			}),
			Course({ id }).increaseCost({ sync: cost }),
		])
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
		userEmail,
	}: {
		similarText: string
		filter: object
		topK: number
		userEmail?: string
	}) => {
		const namespace = `resource:${id}`

		const { embedding, cost } = await getEmbedding(similarText)

		const vdb = await vdbPromise

		const [{ matches }] = await Promise.all([
			vdb.query({
				queryRequest: {
					vector: embedding,
					filter:
						Object.keys(filter).length === 0 ? undefined : filter,
					topK,
					includeMetadata: true,
					namespace,
				},
			}),
			userEmail &&
				User({ email: userEmail }).increaseCost({ messageBoard: cost }),
		])

		return (matches ?? []).map((match) =>
			resourceMetadataSchema.parse(match.metadata)
		)
	},
	updateResources: async ({
		set,
		filter,
	}: {
		set: Partial<Resource>
		filter: object
	}) => {
		const namespace = `resource:${id}`

		const [vdb, embeddingResponse] = await Promise.all([
			vdbPromise,
			set.text !== undefined ? await getEmbedding(set.text) : undefined,
		])

		await Promise.all([
			...(
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
						...(embeddingResponse !== undefined
							? { values: embeddingResponse.embedding }
							: {}),
						setMetadata: set,
						namespace,
					},
				})
			),
			embeddingResponse &&
				Course({ id }).increaseCost({ sync: embeddingResponse.cost }),
		])
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

		const [vdb, { embedding, cost }] = await Promise.all([
			vdbPromise,
			getEmbedding(content),
		])

		await Promise.all([
			vdb.upsert({
				upsertRequest: {
					vectors: [
						{
							id: `message:${id}:${fromEmail}:${sentAt.valueOf()}`,
							values: embedding,
							metadata: {
								fromEmail,
								content,
								sentAt: sentAt.valueOf(),
							},
						},
					],
					namespace,
				},
			}),
			User({ email: fromEmail }).increaseCost({ messageBoard: cost }),
		])

		return {
			sentAt,
		}
	},
	// consider including score
	getSimilarMessages: async ({
		content,
		limit,
		userEmail,
	}: {
		content: string
		limit: number
		userEmail?: string
	}) => {
		const namespace = `message:${id}`

		const { embedding, cost } = await getEmbedding(content)

		const increaseCostPromise =
			userEmail &&
			User({ email: userEmail }).increaseCost({
				messageBoard: cost,
			})

		const vdb = await vdbPromise

		const { matches } = await vdb.query({
			queryRequest: {
				vector: embedding,
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

		await increaseCostPromise

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
	increaseCost: async (cost: { sync?: number; insights?: number }) => {
		await db
			.update(course)
			.set({
				syncCost: cost.sync && sql`sync_cost + ${cost.sync}`,
				insightsCost:
					cost.insights && sql`insights_cost + ${cost.insights}`,
			})
			.where(eq(course.id, id))
	},
})

export default Course
