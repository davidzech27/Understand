import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Assignment from "~/data/Assignment"
import User from "~/data/User"
import cn from "~/utils/cn"
import formatDate from "~/utils/formatDate"
import Heading from "~/components/Heading"
import GradientText from "~/components/GradientText"
import Card from "~/components/Card"
import AssignmentField from "./AssignmentField"

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
			User({ email }).courseRole({ id: courseId }),
		),
		Assignment({ courseId, assignmentId }).get(),
	])

	if (role !== "teacher" || assignment === undefined) notFound()

	return (
		<Card className="flex h-full flex-col overflow-y-scroll px-6 py-5">
			<div className="flex items-center justify-between">
				<GradientText asChild>
					<a
						href={assignment.syncedUrl}
						target="_blank"
						rel="noreferrer"
						className={cn(
							"pb-5 text-6xl font-extrabold tracking-tight",
							assignment.syncedUrl !== undefined &&
								"transition-all duration-150 hover:opacity-80",
						)}
					>
						{assignment.title}
					</a>
				</GradientText>

				<span className="relative bottom-1 ml-6 mr-3 flex-shrink-0 select-text text-base font-semibold leading-none text-black/70">
					{assignment.dueAt
						? `Due ${formatDate(assignment.dueAt)}`
						: "No due date"}
				</span>
			</div>

			{assignment.description !== undefined && (
				<>
					<Heading size="large" className="mb-2 ml-1">
						Description
					</Heading>

					<AssignmentField assignment={assignment} className="mb-2.5">
						{assignment.description}
					</AssignmentField>
				</>
			)}

			{assignment.instructions !== undefined ? (
				<>
					<Heading size="large" className="mb-2 ml-1">
						Instructions
					</Heading>

					<AssignmentField assignment={assignment}>
						{assignment.instructions}
					</AssignmentField>
				</>
			) : (
				<Heading size="large">
					Instructions for this assignment couldn&apos;t be found on
					Google Classroom. Use the settings button above and to the
					right to set them manually.
				</Heading>
			)}
		</Card>
	)
}
