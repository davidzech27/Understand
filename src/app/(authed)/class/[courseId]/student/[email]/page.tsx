import Card from "~/components/Card"
import User from "~/data/User"
import Insight from "./Insight"
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
				.lastSubmissionHTML({
					courseId,
					assignmentId: source.assignmentId,
				})
				.then((submissionHTML) => submissionHTML ?? ""),
			paragraphs: source.paragraphs,
		})),
	}))

	return (
		<Card className="flex h-full flex-col space-y-2 px-6 pt-5 pb-80">
			{studentInsights === undefined || studentInsights.length === 0 ? (
				<span className="text-lg font-medium opacity-60">
					No data for student
				</span>
			) : (
				studentInsights.map((insight) => (
					<>
						<div className="ml-1 text-lg font-medium opacity-60">
							{insight.type}
						</div>

						<Insight
							content={insight.content}
							sources={insight.sources}
						/>
					</>
				))
			)}
		</Card>
	)
}

export default StudentPage
