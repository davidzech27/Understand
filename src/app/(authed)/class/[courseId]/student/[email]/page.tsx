import Card from "~/components/Card"
import StudentInsight from "~/data/StudentInsight"
import Insight from "./Insight"
import InsightData from "~/data/Insight"
import Assignment from "~/data/Assignment"

export const dynamic = "force-dynamic"

interface Params {
	courseId: string
	email: string
}

// consider adding stream-like interface. may belong in other places as well
const StudentPage = async ({
	params: { courseId, email },
}: {
	params: Params
}) => {
	email = decodeURIComponent(email)

	const studentInsights = (
		await StudentInsight({
			courseId,
			studentEmail: email,
		}).get()
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
			submission: InsightData({
				courseId,
				studentEmail: email,
				assignmentId: source.assignmentId,
			}).submission(),
			paragraphs: source.paragraphs,
		})),
	}))

	const strengths = (studentInsights ?? []).filter(
		(insight) => insight.type === "strength"
	)

	const weaknesses = (studentInsights ?? []).filter(
		(insight) => insight.type === "weakness"
	)

	return (
		<Card className="flex h-full flex-col space-y-2 px-6 pt-5 pb-80">
			{studentInsights === undefined || studentInsights.length === 0 ? (
				<span className="text-lg font-medium opacity-60">
					No data for student
				</span>
			) : (
				<>
					<div className="ml-1 text-lg font-medium opacity-60">
						Strengths
					</div>

					{strengths.length !== 0 ? (
						<ul className="flex flex-col space-y-2.5">
							{strengths.map((strength, index) => (
								<li key={index}>
									<Insight {...strength} />
								</li>
							))}
						</ul>
					) : (
						<div className="ml-1 opacity-60">
							No strengths found for student. Most likely, these
							got mixed in with their weaknesses, so try checking
							there instead - it&apos;s unlikely that this student
							has no strengths!
						</div>
					)}

					<div className="ml-1 text-lg font-medium opacity-60">
						Weaknesses
					</div>

					<ul className="flex flex-col space-y-2.5">
						{weaknesses.map((weakness, index) => (
							<div key={index}>
								<Insight {...weakness} />
							</div>
						))}
					</ul>
				</>
			)}
		</Card>
	)
}

export default StudentPage
