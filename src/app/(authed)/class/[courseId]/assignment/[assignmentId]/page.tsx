import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import Assignment from "~/data/Assignment"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"
import Card from "~/components/Card"
import AssignmentTabs from "./AssignmentTabs"
import colors from "~/colors.cjs"
import formatDate from "~/utils/formatDate"
import cn from "~/utils/cn"

export const generateMetadata = async ({
	params: { courseId, assignmentId },
}: {
	params: Params
}) => {
	const assignment = await Assignment({ courseId, assignmentId }).get()

	return {
		title: assignment?.title,
	}
}

interface Params {
	courseId: string
	assignmentId: string
}
// todo - make multi-tab and make instructions be on main page and when clicked it should open up editing modal with instructions focused
const AssignmentPage = async ({
	params: { courseId, assignmentId },
}: {
	params: Params
}) => {
	const [role, assignment] = await Promise.all([
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
		Assignment({ courseId, assignmentId }).get(),
	])

	if (role !== "teacher" || assignment === undefined) notFound()

	return (
		<div className="-mr-2 flex flex-col space-y-2.5 overflow-y-scroll">
			<Card className="flex flex-col py-5 px-6">
				<a
					href={assignment.linkedUrl}
					target="_blank"
					className={cn(
						"flex items-baseline justify-between",
						assignment.linkedUrl !== undefined &&
							"transition-all duration-150 hover:opacity-80"
					)}
				>
					<span
						style={{
							background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
						}}
						className="pb-5 text-6xl font-semibold"
					>
						{assignment.title}
					</span>

					<span className="relative bottom-[1px] mr-3 ml-6 flex-shrink-0 text-lg font-medium leading-none opacity-60">
						{assignment.dueAt
							? `Due ${formatDate(assignment.dueAt)}`
							: "No due date"}
					</span>
				</a>

				{assignment.description !== undefined && (
					<p className="select-text px-1 pb-4 text-sm opacity-80">
						{assignment.description}
					</p>
				)}

				<AssignmentTabs assignment={assignment} />
			</Card>

			<Card className="flex h-full flex-col py-5 px-6">
				<span className="italic opacity-60">
					Assignment insights coming soon...
				</span>
			</Card>
		</div>
	)
}

export default AssignmentPage
