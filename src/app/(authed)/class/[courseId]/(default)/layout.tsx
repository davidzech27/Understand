import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import colors from "~/colors.cjs"
import cn from "~/utils/cn"
import ClassTabs from "./ClassTabs"
import Card from "~/components/Card"
import User from "~/data/User"
import Course from "~/data/Course"
import Resource from "~/data/Resource"
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
	const rosterPromise = Course({ id: courseId }).roster()

	const [course, role, anyIndexedResource] = await Promise.all([
		Course({ id: courseId }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
		Resource({ courseId }).any(),
	])

	if (course === undefined || role === "none") notFound()

	return (
		<div className="-mr-2 flex h-full flex-col space-y-2.5 overflow-y-scroll">
			<Card className="flex flex-col justify-between py-5 px-6">
				<div className="group flex items-baseline justify-between">
					<a
						href={course.linkedUrl}
						target="_blank"
						style={{
							background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
						}}
						className={cn(
							"pb-5 text-6xl font-semibold",
							course.linkedUrl !== undefined &&
								"peer transition-all duration-150 hover:opacity-80 peer-hover:opacity-80"
						)}
					>
						{course.name}
					</a>

					{course.section && (
						<a
							href={course.linkedUrl}
							target="_blank"
							className={cn(
								"relative bottom-[1px] mr-1 ml-3 flex-shrink-0 text-base font-medium leading-none opacity-60",
								course.linkedUrl !== undefined &&
									"peer transition-all duration-150 hover:opacity-50 peer-hover:opacity-50"
							)}
						>
							{course.section}
						</a>
					)}
				</div>

				<ClassTabs
					course={course}
					teacherEmailsPromise={rosterPromise.then((roster) =>
						roster.teachers.map((teacher) => teacher.email)
					)}
					studentEmailsPromise={rosterPromise.then((roster) =>
						roster.students.map((student) => student.email)
					)}
					role={role}
					anyIndexedResource={anyIndexedResource}
				/>
			</Card>

			{children}
		</div>
	)
}

export default ClassLayout
