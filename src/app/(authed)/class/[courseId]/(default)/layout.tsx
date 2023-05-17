import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import colors from "~/colors.cjs"
import cn from "~/utils/cn"
import ClassTabs from "./ClassTabs"
import Card from "~/components/Card"
import User from "~/data/User"
import Course from "~/data/Course"
import { getAuthOrThrow } from "~/auth/jwt"

interface Params {
	courseId: string
}

export const generateMetadata = async ({
	params: { courseId },
}: {
	params: Params
}) => {
	const name = (await Course({ id: courseId }).get())?.name

	return {
		template: `%s | ${name}`,
		default: name,
	}
}

const ClassLayout = async ({
	children,
	params: { courseId },
}: {
	children: React.ReactNode
	params: Params
}) => {
	const [course, roster, role] = await Promise.all([
		Course({ id: courseId }).get(),
		Course({ id: courseId }).roster(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (course === undefined || role === "none") notFound()

	return (
		<div className="-mr-2 flex h-full flex-col space-y-2.5 overflow-y-scroll">
			<Card className="flex flex-col justify-between py-5 px-6">
				<a
					href={course.linkedUrl}
					target="_blank"
					className={cn(
						"flex items-baseline justify-between",
						course.linkedUrl !== undefined &&
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
						className="text-6xl font-semibold"
					>
						{course.name}
					</span>

					{course.section && (
						<span className="relative bottom-[1px] mr-1 ml-3 flex-shrink-0 text-base font-medium leading-none opacity-60">
							{course.section}
						</span>
					)}
				</a>

				<div className="mt-5">
					<ClassTabs
						course={course}
						teacherEmails={roster.teachers.map(
							(teacher) => teacher.email
						)}
						studentEmails={roster.students.map(
							(student) => student.email
						)}
						role={role}
					/>
				</div>
			</Card>

			{children}
		</div>
	)
}

export default ClassLayout
