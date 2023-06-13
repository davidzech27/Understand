import { inArray } from "drizzle-orm"
import { z } from "zod"

import getEmbedding from "~/ai/getEmbedding"
import db from "~/db/db"
import { user } from "~/db/schema"
import vdbPromise from "~/db/vdb"

const messageMetadataSchema = z.object({
	fromEmail: z.string(),
	content: z.string(),
	sentAt: z.date(),
})

type Message = z.infer<typeof messageMetadataSchema>

const Message = ({ courseId }: { courseId: string }) => {
	const namespace = `message:${courseId}`

	return {
		create: async ({
			fromEmail,
			content,
		}: {
			fromEmail: string
			content: string
		}) => {
			const sentAt = new Date()

			const [vdb, values] = await Promise.all([
				vdbPromise,
				getEmbedding(content),
			])

			await vdb.upsert({
				upsertRequest: {
					vectors: [
						{
							id: `message:${courseId}:${fromEmail}:${sentAt.valueOf()}`,
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
		getSimilar: async ({
			content,
			limit,
		}: {
			content: string
			limit: number
		}) => {
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
					}
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
					from.name !== undefined
						? { from, content, sentAt }
						: undefined
				)
				.filter(Boolean)
		},
		delete: async ({
			fromEmail,
			sentAt,
		}: {
			fromEmail: string
			sentAt: Date
		}) => {
			const vdb = await vdbPromise

			await vdb.delete1({
				ids: [`message:${courseId}:${fromEmail}:${sentAt.valueOf()}`],
			})
		},
	}
}

export default Message
