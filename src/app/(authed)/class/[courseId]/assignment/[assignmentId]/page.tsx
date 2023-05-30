import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import Assignment from "~/data/Assignment"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"
import Card from "~/components/Card"
import AssignmentTabs from "./AssignmentTabs"
import colors from "~/colors.cjs"
import FormattedDate from "~/utils/FormattedDate"
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
		<div className="-mr-2 flex h-full flex-col space-y-2.5 overflow-y-scroll">
			<Card className="flex flex-col py-5 px-6">
				<div className="flex items-baseline justify-between">
					<a
						href={assignment.linkedUrl}
						target="_blank"
						style={{
							background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
						}}
						className={cn(
							"pb-5 text-6xl font-semibold",
							assignment.linkedUrl !== undefined &&
								"transition-all duration-150 hover:opacity-80"
						)}
					>
						{assignment.title}
					</a>

					<span className="relative bottom-[1px] mr-3 ml-6 flex-shrink-0 text-lg font-medium leading-none opacity-60">
						{assignment.dueAt ? (
							<FormattedDate
								prefix="Due "
								date={assignment.dueAt}
							/>
						) : (
							"No due date"
						)}
					</span>
				</div>

				{assignment.description !== undefined && (
					<p className="select-text px-1 pb-4 text-sm opacity-80">
						{assignment.description}
					</p>
				)}

				<AssignmentTabs assignment={assignment} />
			</Card>

			<Card className="flex h-full flex-col py-5 px-6">
				{assignment.instructions !== undefined ? (
					<>
						<div className="ml-1 mb-2 text-lg font-medium opacity-60">
							Instructions
						</div>

						<p className="select-text whitespace-pre-line rounded-md border-[0.75px] border-border bg-surface-hover px-3 py-2 font-medium opacity-80">
							{assignment.instructions}
						</p>
					</>
				) : (
					<div className="text-lg font-medium opacity-60">
						Instructions for this assignment couldn&apos;t be found
						on Google Classroom. Use the settings button above and
						to the right to set them manually.
					</div>
				)}
			</Card>
		</div>
	)
}

export default AssignmentPage
