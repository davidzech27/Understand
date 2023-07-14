import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import Assignment from "~/data/Assignment"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"
import Card from "~/components/Card"
import Instructions from "./Instructions"

export const metadata = {
	title: "Overview",
}

export const runtime = "edge"

interface Params {
	courseId: string
	assignmentId: string
}

export default async function AssignmentPage({
	params: { courseId, assignmentId },
}: {
	params: Params
}) {
	const [role, assignment] = await Promise.all([
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
		Assignment({ courseId, assignmentId }).get(),
	])

	if (role !== "teacher" || assignment === undefined) notFound()

	return (
		<Card className="flex h-full flex-col overflow-y-scroll py-5 px-6">
			{assignment.instructions !== undefined ? (
				<>
					<div className="ml-1 mb-2 text-lg font-medium opacity-60">
						Instructions
					</div>

					<Instructions assignment={assignment} />
				</>
			) : (
				<div className="text-lg font-medium opacity-60">
					Instructions for this assignment couldn&apos;t be found on
					Google Classroom. Use the settings button above and to the
					right to set them manually.
				</div>
			)}
		</Card>
	)
}
