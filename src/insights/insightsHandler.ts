import { verifySignature } from "@upstash/qstash/nextjs"
import { type NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { Logger } from "next-axiom"

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

async function insightsHandler(req: NextApiRequest, res: NextApiResponse) {
	new Logger().info("Insights sync called", req.body)

	const generateCall = generateCallSchema.parse(req.body)

	if (generateCall.name === "course") {
		const unsyncedFeedbackInsights = await Course({
			id: generateCall.courseId,
		}).unsyncedFeedbackInsights()

		const unsyncedAssignmentIds = [
			...new Set(
				unsyncedFeedbackInsights.map((insight) => insight.assignmentId)
			),
		]

		const unsyncedStudentEmails = [
			...new Set(
				unsyncedFeedbackInsights.map((insight) => insight.studentEmail)
			),
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
