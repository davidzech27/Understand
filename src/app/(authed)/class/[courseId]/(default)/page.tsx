import { notFound } from "next/navigation"

import Course from "~/data/Course"
import Card from "~/components/Card"

interface Params {
	courseId: string
}

const ClassPage = async ({ params: { courseId } }: { params: Params }) => {
	const course = await Course({ id: courseId }).get()

	if (course === undefined) notFound()

	return (
		<Card className="flex flex-1 flex-col py-5 px-6">
			<span className="opacity-60">Class home coming soon...</span>
		</Card>
	)
}

export default ClassPage
