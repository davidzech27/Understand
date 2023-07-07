import { and, eq } from "drizzle-orm"
import { verifySignature } from "@upstash/qstash/nextjs"
import { type NextApiHandler } from "next"
import { z } from "zod"

import db from "~/db/db"
import callGenerate from "./callGenerate"
import generateStudentInsights from "./generateStudentInsights"
import generateAssignmentInsights from "./generateAssignmentInsights"
import Course from "~/data/Course"

const generateCallSchema = z.discriminatedUnion("name", [
	z.object({
		name: z.literal("course"),
		courseId: z.string(),
	}),
	z.object({
		name: z.literal("student"),
		courseId: z.string(),
		studentEmail: z.string(),
	}),
	z.object({
		name: z.literal("assignment"),
		courseId: z.string(),
		assignmentId: z.string(),
	}),
])

export type GenerateCall = z.infer<typeof generateCallSchema>

const insightsHandler: NextApiHandler = async (req, res) => {
	console.info("Insights API handler body: ", JSON.stringify(req.body))

	const generateCall = generateCallSchema.parse(req.body)

	if (generateCall.name === "course") {
		const unsyncedInsights = await Course({
			id: generateCall.courseId,
		}).unsyncedInsights()

		const unsyncedAssignmentIds = [
			...new Set(unsyncedInsights.map((insight) => insight.assignmentId)),
		]

		const unsyncedStudentEmails = [
			...new Set(unsyncedInsights.map((insight) => insight.studentEmail)),
		]

		await Promise.all([
			...unsyncedAssignmentIds.map((assignmentId) =>
				callGenerate({
					name: "assignment",
					courseId: generateCall.courseId,
					assignmentId,
				})
			),
			...unsyncedStudentEmails.map((studentEmail) =>
				callGenerate({
					name: "student",
					courseId: generateCall.courseId,
					studentEmail,
				})
			),
		])
	} else if (generateCall.name === "student") {
		await generateStudentInsights({
			courseId: generateCall.courseId,
			studentEmail: generateCall.studentEmail,
		})
	} else if (generateCall.name === "assignment") {
		await generateAssignmentInsights({
			courseId: generateCall.courseId,
			assignmentId: generateCall.assignmentId,
		})
	}

	res.status(200).end()
}

export default verifySignature(insightsHandler)
