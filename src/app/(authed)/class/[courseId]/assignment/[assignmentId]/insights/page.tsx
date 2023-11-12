import { notFound } from "next/navigation"

import Assignment from "~/data/Assignment"
import User from "~/data/User"
import cn from "~/utils/cn"
import Card from "~/components/Card"
import Insight from "./Insight"
import Heading from "~/components/Heading"

export const metadata = {
	title: "Insights",
}

export const runtime = "edge"

export const dynamic = "force-dynamic"

interface Params {
	courseId: string
	assignmentId: string
}

export default async function AssignmentInsightsPage({
	params: { courseId, assignmentId },
}: {
	params: Params
}) {
	const [assignmentInsights, assignment] = await Promise.all([
		Assignment({
			courseId,
			assignmentId,
		})
			.insights()
			.then(
				(insights) =>
					insights?.map((insight) => ({
						...insight,
						sources: insight.sources.map((source) => ({
							student: User({
								email: source.studentEmail,
							})
								.get()
								.then(
									(student) =>
										student ?? { email: "", name: "" },
								),
							submission: User({
								email: source.studentEmail,
							})
								.lastFeedbackInsights({
									courseId,
									assignmentId,
								})
								.then(
									(lastFeedbackInsights) =>
										lastFeedbackInsights?.submissionHTML ??
										"",
								),
							paragraphs: source.paragraphs,
						})),
					})),
			),
		Assignment({ courseId, assignmentId }).get(),
	])

	if (assignment === undefined) notFound()

	const strengths = (assignmentInsights ?? []).filter(
		(insight) => insight.type === "strength",
	)

	const weaknesses = (assignmentInsights ?? []).filter(
		(insight) => insight.type === "weakness",
	)

	const totalStudentsPromise = Promise.all(
		assignmentInsights
			?.map(({ sources }) => sources.map(({ student }) => student))
			.flat() ?? [],
	).then((students) => new Set(students.map(({ email }) => email)).size)

	return (
		<Card
			className={cn(
				"flex flex-col space-y-2 px-6 pb-80 pt-5",
				(assignmentInsights === undefined ||
					assignmentInsights.length === 0) &&
					"h-full",
			)}
		>
			{assignmentInsights === undefined ||
			assignmentInsights.length === 0 ? (
				<Heading size="large">
					No insights from {assignment.title} yet
				</Heading>
			) : (
				<>
					<div className="flex justify-between px-1">
						<Heading size="large">Strengths</Heading>

						<Heading size="large">{strengths.length}</Heading>
					</div>

					<ul className="flex flex-col space-y-2.5">
						{strengths.map((strength, index) => (
							<li key={index}>
								<Insight
									{...strength}
									totalStudentsPromise={totalStudentsPromise}
								/>
							</li>
						))}
					</ul>

					<div className="flex justify-between px-1">
						<Heading size="large">Weaknesses</Heading>

						<Heading size="large">{weaknesses.length}</Heading>
					</div>

					<ul className="flex flex-col space-y-2.5">
						{weaknesses.map((weakness, index) => (
							<div key={index}>
								<Insight
									{...weakness}
									totalStudentsPromise={totalStudentsPromise}
								/>
							</div>
						))}
					</ul>
				</>
			)}
		</Card>
	)
}
