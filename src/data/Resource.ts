import { z } from "zod"

import vdbPromise from "~/db/vdb"
import getEmbedding from "~/ai/getEmbedding"

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

const getFormattedText = (resource: Resource) =>
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

const Resource = ({ courseId }: { courseId: string }) => {
	const namespace = `resource:${courseId}`

	return {
		create: async (resource: Resource) => {
			const vdb = await vdbPromise

			vdb.upsert({
				upsertRequest: {
					vectors: [
						{
							id: `resource:${courseId}:${
								"driveId" in resource
									? "drive"
									: "instructionsForAssignmentId" in resource
									? "description"
									: ""
							}:${
								"driveId" in resource
									? resource.driveId
									: "instructionsForAssignmentId" in resource
									? resource.instructionsForAssignmentId
									: ""
							}`,
							values: await getEmbedding(
								getFormattedText(resource)
							),
							metadata: resource,
						},
					],
					namespace,
				},
			})
		},
		getMany: async ({ filter }: { filter: object }) => {
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
		search: async ({
			similarText,
			filter,
			topK,
		}: {
			similarText: string
			filter: object
			topK: number
		}) => {
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
		update: async ({
			set,
			filter,
		}: {
			set: Partial<Resource>
			filter: object
		}) => {
			const [vdb, values] = await Promise.all([
				vdbPromise,
				set.text !== undefined
					? await getEmbedding(set.text)
					: undefined,
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
		delete: async ({ filter }: { filter: object }) => {
			const vdb = await vdbPromise

			if (Object.keys(filter).length === 0) {
				await vdb.delete1({
					deleteAll: true,
					namespace: `resource:${courseId}`,
				})
			} else {
				const ids = (
					await vdb.query({
						queryRequest: {
							vector: Array(1536).fill(0),
							filter,
							namespace,
							topK: 10_000,
						},
					})
				).matches?.map(({ id }) => id)

				if (ids === undefined) return

				await vdb.delete1({
					ids,
				})
			}
		},
	}
}

export default Resource
