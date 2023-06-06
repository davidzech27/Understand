import { verifySignature } from "@upstash/qstash/nextjs"
import { NextApiHandler } from "next"
import { z } from "zod"
import { Highlight } from "@highlight-run/next"

import callSync from "./callSync"
import syncRoster from "./syncRoster"
import syncResources from "./syncResources"
import syncAssignment from "./syncAssignment"
import { env } from "~/env.mjs"

const syncCallSchema = z.discriminatedUnion("name", [
	z.object({
		name: z.literal("roster"),
		courseId: z.string(),
	}),
	z.object({
		name: z.literal("resources"),
		courseId: z.string(),
	}),
	z.object({
		name: z.literal("assignment"),
		courseId: z.string(),
		assignmentId: z.string(),
	}),
])

export type SyncCall = z.infer<typeof syncCallSchema>

const syncHandler: NextApiHandler = async (req, res) => {
	console.info("Sync API handler body: ", JSON.stringify(req.body))

	const syncCall = syncCallSchema.parse(req.body)

	if (syncCall.name === "roster") {
		await syncRoster({ courseId: syncCall.courseId })
	} else if (syncCall.name === "resources") {
		await Promise.all(
			(
				await syncResources({ courseId: syncCall.courseId })
			).assignmentIdsToSync.map(
				async (assignmentId) =>
					await callSync({
						name: "assignment",
						courseId: syncCall.courseId,
						assignmentId,
					})
			)
		)
	} else if (syncCall.name === "assignment") {
		await syncAssignment({
			courseId: syncCall.courseId,
			assignmentId: syncCall.assignmentId,
		})
	}

	res.status(200).end()
}

export default verifySignature(
	Highlight({ projectID: env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID })(syncHandler)
)
