import Card from "~/components/Card"

export const metadata = {
	title: "Insights",
}

interface Params {
	id: string
}
//! fix keyboard usability and outlines
const InsightsPage = async ({ params: { id } }: { params: Params }) => {
	return (
		<Card className="flex flex-1 flex-col py-5 px-6">
			<span className="font-medium italic opacity-60">
				Classroom insights coming soon...
			</span>
		</Card>
	)
}

export default InsightsPage
