import { notFound } from "next/navigation"

import Course from "~/data/Course"
import Card from "~/components/Card"

interface Params {
	id: string
}

const ClassPage = async ({ params: { id } }: { params: Params }) => {
	const course = await Course({ id }).get()

	if (course === undefined) notFound()

	return (
		<Card className="flex flex-1 flex-col py-5 px-6">
			<span className="font-medium italic opacity-60">
				Class home coming soon...
			</span>
		</Card>
	)
}

export default ClassPage
