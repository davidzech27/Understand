import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import Assignment from "~/data/Assignment"
import User from "~/data/User"
import Card from "~/components/Card"
import AssignmentTabs from "./AssignmentTabs"

export async function generateMetadata({
	params: { courseId, assignmentId },
}: {
	params: Params
}) {
	const assignment = await Assignment({ courseId, assignmentId }).get()

	return {
		title: {
			template: `%s | ${assignment?.title}`,
			default: assignment?.title ?? "",
		},
	}
}

interface Params {
	courseId: string
	assignmentId: string
}

export default async function AssignmentLayout({
	children,
	params: { courseId, assignmentId },
}: {
	children: React.ReactNode
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
		<div className="-mr-2 flex h-full flex-col space-y-2.5 overflow-y-scroll">
			<Card className="px-4 py-3">
				<AssignmentTabs assignment={assignment} />
			</Card>

			{children}
		</div>
	)
}
