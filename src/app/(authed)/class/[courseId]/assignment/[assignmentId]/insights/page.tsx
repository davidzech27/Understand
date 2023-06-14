import AssignmentInsight from "~/data/AssignmentInsight"
import InsightData from "~/data/Insight"
import User from "~/data/User"
import Card from "~/components/Card"
import Insight from "./Insight"

export const metadata = {
	title: "Insights",
}

export const dynamic = "force-dynamic"

interface Params {
	courseId: string
	assignmentId: string
}

const AssignmentInsightsPage = async ({
	params: { courseId, assignmentId },
}: {
	params: Params
}) => {
	const assignmentInsights = (
		await AssignmentInsight({
			courseId,
			assignmentId,
		}).get()
	)?.map((insight) => ({
		...insight,
		sources: insight.sources.map((source) => ({
			student: User({
				email: source.studentEmail,
			})
				.get()
				.then((student) => student ?? { email: "", name: "" }),
			submission: InsightData({
				courseId,
				assignmentId,
				studentEmail: source.studentEmail,
			}).submission(),
			paragraphs: source.paragraphs,
		})),
	}))

	const strengths = (assignmentInsights ?? []).filter(
		(insight) => insight.type === "strength"
	)

	const weaknesses = (assignmentInsights ?? []).filter(
		(insight) => insight.type === "weakness"
	)

	return (
		<Card className="flex h-full flex-col space-y-2 px-6 pt-5 pb-80">
			{assignmentInsights === undefined ||
			assignmentInsights.length === 0 ? (
				<span className="text-lg font-medium opacity-60">
					No data for assignment
				</span>
			) : (
				<>
					<div className="ml-1 text-lg font-medium opacity-60">
						Strengths
					</div>

					<ul className="flex flex-col space-y-2.5">
						{strengths.map((strength, index) => (
							<li key={index}>
								<Insight {...strength} />
							</li>
						))}
					</ul>

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

export default AssignmentInsightsPage