"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import { getAuthOrThrow } from "~/auth/jwt"
import Assignment from "~/data/Assignment"
import Course from "~/data/Course"
import User from "~/data/User"

const getSimilarResourcesAction = zact(
	z.object({ courseId: z.string(), similarText: z.string() })
)(async ({ courseId, similarText }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const role = await User({ email }).courseRole({ id: courseId })

	if (role === "none") throw new Error("User not in class")

	const similarResourcesUntransformed = await Course({
		id: courseId,
	}).searchResources({
		similarText,
		topK: 10,
		filter: {},
	})

	const similarResourcesUnfiltered = (
		await Promise.all(
			similarResourcesUntransformed.map(async (resource, index) => {
				if (resource.instructionsForAssignmentId !== undefined) {
					if (
						similarResourcesUntransformed
							.slice(0, index)
							.findIndex(
								(previousResource) =>
									"instructionsForAssignmentId" in
										previousResource &&
									previousResource.instructionsForAssignmentId ===
										resource.instructionsForAssignmentId
							) !== -1
					)
						return undefined

					const assignment = await Assignment({
						courseId,
						assignmentId: resource.instructionsForAssignmentId,
					}).get()

					if (assignment === undefined) return undefined

					return `Assignment title: ${assignment.title}

${
	assignment.description !== undefined
		? `Assignment description: ${assignment.description}\n\n`
		: ""
}Assignment instructions: ${assignment.instructions}

Assignment due date: ${
						assignment.dueAt !== undefined
							? assignment.dueAt.toLocaleString()
							: "No due date set"
					}`
				} else {
					return `${
						"driveTitle" in resource
							? `Document title: ${resource.driveTitle}\n\n`
							: ""
					}Content: ${resource.text}`
				}
			})
		)
	).filter(Boolean)

	const similarResources: typeof similarResourcesUnfiltered = []

	const wordLimit = 8000 // potentially make dynamic later

	let words = 0

	for (const resource of similarResourcesUnfiltered) {
		const wordCount = resource
			.split(/\s/)
			.filter((word) => word.trim() !== "").length

		if (words + wordCount > wordLimit) break

		words += wordCount

		similarResources.push(resource)
	}

	return similarResources
})

export default getSimilarResourcesAction
