import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import cn from "~/utils/cn"
import formatDate from "~/utils/formatDate"
import Assignment from "~/data/Assignment"
import User from "~/data/User"
import Card from "~/components/Card"
import AssignmentTabs from "./AssignmentTabs"
import GradientText from "~/components/GradientText"

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
			<Card className="flex flex-col py-5 px-6">
				<div className="flex items-baseline justify-between">
					<GradientText asChild>
						<a
							href={assignment.linkedUrl}
							target="_blank"
							className={cn(
								"pb-5 text-6xl font-semibold",
								assignment.linkedUrl !== undefined &&
									"transition-all duration-150 hover:opacity-80"
							)}
						>
							{assignment.title}
						</a>
					</GradientText>

					<span className="relative bottom-[1px] mr-3 ml-6 flex-shrink-0 text-lg font-medium leading-none opacity-60">
						{assignment.dueAt
							? `Due ${formatDate(assignment.dueAt)}`
							: "No due date"}
					</span>
				</div>

				{assignment.description !== undefined && (
					<p className="select-text px-1 pb-4 text-sm opacity-80">
						{assignment.description}
					</p>
				)}

				<AssignmentTabs role={role} assignment={assignment} />
			</Card>

			{children}
		</div>
	)
}
