import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Assignment from "~/data/Assignment"
import User from "~/data/User"
import Course from "~/data/Course"
import Feedback from "./Feedback"
import GoogleAPI from "~/google/GoogleAPI"
import FeedbackData from "~/data/Feedback"

export const generateMetadata = async ({
	params: { courseId, assignmentId },
}: {
	params: Params
}) => {
	const assignment = await Assignment({ courseId, assignmentId }).get()

	return {
		title: `Feedback on ${assignment?.title}`,
	}
}

export const runtime = "edge"

interface Params {
	courseId: string
	assignmentId: string
}

const FeedbackPage = async ({
	params: { courseId, assignmentId },
}: {
	params: Params
}) => {
	const [[role, profile, submissions, feedback], assignment, course] =
		await Promise.all([
			getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
				Promise.all([
					User({ email }).courseRole({
						id: courseId,
					}),
					User({ email }).get(),
					Course({
						id: courseId,
					})
						.linkedRefreshToken()
						.then(async (refreshToken) => {
							if (refreshToken === undefined) return []

							const googleAPI = await GoogleAPI({
								refreshToken,
							})

							return (
								await googleAPI.studentSubmissions({
									courseId,
									assignmentId,
									email,
								})
							)
								.map((submission) =>
									submission.type === "driveFile"
										? submission.driveFile
										: undefined
								)
								.filter(Boolean)
								.map((submission) => ({
									...submission,
									html: googleAPI.driveFileHTML({
										id: submission.id,
									}),
								}))
						}),
					User({ email })
						.feedback({ courseId, assignmentId })
						.then((feedback) =>
							feedback.map(({ givenAt }) => {
								const feedbackInfoPromise = Promise.all([
									FeedbackData({
										courseId,
										assignmentId,
										userEmail: email,
										givenAt,
									}).get(),
									FeedbackData({
										courseId,
										assignmentId,
										userEmail: email,
										givenAt,
									}).followUps(),
								]).then(([feedback, followUps]) => {
									if (feedback === undefined) notFound()

									const lines =
										feedback.rawResponse.split("\n")

									const headerLineIndex = {
										specificFeedback: lines.findIndex(
											(line) =>
												line.search(
													/^Specific Feedback:?\s*$/
												) !== -1
										),
										generalFeedback: lines.findIndex(
											(line) =>
												line.search(
													/^General Feedback:?\s*$/
												) !== -1
										),
									}

									const specificFeedbackList = lines
										.slice(
											headerLineIndex.specificFeedback +
												1,
											headerLineIndex.generalFeedback
										)
										.join("\n")
										.split("\n\n")
										.map((feedback) => ({
											paragraph: Number(
												feedback.match(
													/(?<=^(\d\.[ ])?\s*Paragraph( number)?[ ]?:? ?)\d+/g
												)?.[0]
											),
											sentence: Number(
												feedback.match(
													/(?<=\nSentence( number)?[ ]?:? ?)-?\d+/g
												)?.[0]
											),
											content:
												feedback.match(
													/(?<=\nFeedback[ ]?: ).+/g
												)?.[0] ?? "",
										}))
										.map((feedback) => ({
											...feedback,
											followUps:
												followUps.specific.find(
													(followUpList) =>
														followUpList.paragraphNumber ===
															feedback.paragraph &&
														followUpList.sentenceNumber ===
															feedback.sentence
												)?.messages ?? [],
										}))

									const generalFeedback = {
										content: lines
											.slice(
												headerLineIndex.generalFeedback +
													1
											)
											.join("\n"),
										followUps: followUps.general,
									}

									return {
										submissionHTML: feedback.submissionHTML,
										specificFeedbackList,
										generalFeedback,
										rawResponse: feedback.rawResponse,
									}
								})

								return {
									givenAt,
									submissionHTMLPromise:
										feedbackInfoPromise.then(
											({ submissionHTML }) =>
												submissionHTML
										),
									specificFeedbackListPromise:
										feedbackInfoPromise.then(
											({ specificFeedbackList }) =>
												specificFeedbackList
										),
									generalFeedbackPromise:
										feedbackInfoPromise.then(
											({ generalFeedback }) =>
												generalFeedback
										),
									rawResponsePromise:
										feedbackInfoPromise.then(
											({ rawResponse }) => rawResponse
										),
								}
							})
						),
				])
			),
			Assignment({ courseId, assignmentId }).get(),
			Course({ id: courseId }).get(),
		])

	if (
		role === "none" ||
		profile === undefined ||
		assignment === undefined ||
		course === undefined ||
		assignment.instructions === undefined
	)
		notFound()

	return (
		<Feedback
			assignment={{
				...assignment,
				instructions: assignment.instructions,
			}}
			feedbackHistory={feedback}
			email={profile.email}
			profileName={profile.name}
			courseName={course.name}
			role={role}
			submissions={submissions}
		/>
	)
}

export default FeedbackPage
