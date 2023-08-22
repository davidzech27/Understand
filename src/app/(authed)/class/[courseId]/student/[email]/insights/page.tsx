import Card from "~/components/Card"
import User from "~/data/User"
import Insight from "./Insight"
import Assignment from "~/data/Assignment"
import Heading from "~/components/Heading"

export const runtime = "edge"

export const dynamic = "force-dynamic"

interface Params {
	courseId: string
	email: string
}

export const metadata = {
	title: "Insights",
}

export default async function StudentInsightsPage({
	params: { courseId, email },
}: {
	params: Params
}) {
	email = decodeURIComponent(email)

	const studentInsights = (
		await User({
			email,
		}).insights({ courseId })
	)?.map((insight) => ({
		...insight,
		sources: insight.sources.map((source) => ({
			assignment: Assignment({
				courseId,
				assignmentId: source.assignmentId,
			})
				.get()
				.then(
					(assignment) =>
						assignment ?? { assignmentId: "", title: "" }
				),
			submissionHTML: User({ email })
				.lastFeedbackInsights({
					courseId,
					assignmentId: source.assignmentId,
				})
				.then(
					(lastFeedbackInsights) =>
						lastFeedbackInsights?.submissionHTML ?? ""
				),
			paragraphs: source.paragraphs,
		})),
	}))

	const strengths = (studentInsights ?? []).filter(
		(insight) => insight.type === "strength"
	)

	const weaknesses = (studentInsights ?? []).filter(
		(insight) => insight.type === "weakness"
	)

	const totalAssignmentsPromise = Promise.all(
		studentInsights
			?.map(({ sources }) => sources.map(({ assignment }) => assignment))
			.flat() ?? []
	).then(
		(assignments) =>
			new Set(assignments.map(({ assignmentId }) => assignmentId)).size
	)

	return (
		<Card className="flex flex-col space-y-2 px-6 pt-5 pb-80">
			{studentInsights === undefined || studentInsights.length === 0 ? (
				<span className="text-lg font-medium opacity-60">
					No data for student
				</span>
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
									totalAssignmentsPromise={
										totalAssignmentsPromise
									}
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
									totalAssignmentsPromise={
										totalAssignmentsPromise
									}
								/>
							</div>
						))}
					</ul>
				</>
			)}
		</Card>
	)
}
