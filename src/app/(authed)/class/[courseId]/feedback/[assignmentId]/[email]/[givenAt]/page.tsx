import { notFound } from "next/navigation"

import User from "~/data/User"
import Assignment from "~/data/Assignment"
import { getAuthOrThrow } from "~/auth/jwt"
import { cookies } from "next/headers"
import Feedback from "~/data/Feedback"
import FeedbackComponent from "./Feedback"

export const generateMetadata = async ({
	params: { courseId, assignmentId, email },
}: {
	params: Params
}) => {
	email = decodeURIComponent(email)

	const [user, assignment] = await Promise.all([
		User({ email }).get(),
		Assignment({ courseId, assignmentId }).get(),
	])

	return {
		title: `${user?.name}'s feedback on ${assignment?.title}`,
	}
}

interface Params {
	courseId: string
	assignmentId: string
	email: string
	givenAt: string
}

const FeedbackPage = async ({
	params: { courseId, assignmentId, email, givenAt: givenAtString },
}: {
	params: Params
}) => {
	email = decodeURIComponent(email)

	const givenAt = new Date(Number(givenAtString))

	const [feedback, followUps, assignment, role] = await Promise.all([
		Feedback({ courseId, assignmentId, userEmail: email, givenAt }).get(),
		Feedback({
			courseId,
			assignmentId,
			userEmail: email,
			givenAt,
		}).followUps(),
		Assignment({ courseId, assignmentId }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (feedback === undefined || assignment === undefined || role === "none")
		notFound()

	const lines = feedback.rawResponse.split("\n")

	const headerLineIndex = {
		specificFeedback: lines.findIndex(
			(line) => line.search(/^Specific Feedback:?\s*$/) !== -1
		),
		generalFeedback: lines.findIndex(
			(line) => line.search(/^General Feedback:?\s*$/) !== -1
		),
	}

	const specificFeedbackList = lines
		.slice(
			headerLineIndex.specificFeedback + 1,
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
				feedback.match(/(?<=\nSentence( number)?[ ]?:? ?)-?\d+/g)?.[0]
			),
			content: feedback.match(/(?<=\nFeedback[ ]?: ).+/g)?.[0] ?? "",
		}))
		.map((feedback) => ({
			...feedback,
			followUps:
				followUps.specific.find(
					(followUpList) =>
						followUpList.paragraphNumber === feedback.paragraph &&
						followUpList.sentenceNumber === feedback.sentence
				)?.messages ?? [],
		}))

	const generalFeedback = {
		content: lines.slice(headerLineIndex.generalFeedback + 1).join("\n"),
		followUps: followUps.general,
	}

	return (
		<FeedbackComponent
			assignment={assignment}
			submissionHTML={feedback.submissionHTML}
			generalFeedback={generalFeedback}
			specificFeedbackList={specificFeedbackList}
		/>
	)
}

export default FeedbackPage
