import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import cn from "~/utils/cn"
import ClassTabs from "./ClassTabs"
import Card from "~/components/Card"
import User from "~/data/User"
import Course from "~/data/Course"
import GradientText from "~/components/GradientText"

interface Params {
	courseId: string
}

export async function generateMetadata({
	params: { courseId },
}: {
	params: Params
}) {
	const name = (await Course({ id: courseId }).get())?.name

	return {
		title: {
			template: `%s | ${name}`,
			default: name ?? "",
		},
	}
}

export default async function ClassLayout({
	children,
	params: { courseId },
}: {
	children: React.ReactNode
	params: Params
}) {
	const teacherEmailsPromise = Course({ id: courseId })
		.teachers()
		.then((teachers) => teachers.map(({ email }) => email))

	const studentEmailsPromise = Course({ id: courseId })
		.students()
		.then((students) => students.map(({ email }) => email))

	const [course, role, hasResources] = await Promise.all([
		Course({ id: courseId }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
		Course({ id: courseId }).hasResources(),
	])

	if (course === undefined || role === "none") notFound()

	return (
		<div className="-mr-2 flex h-full flex-col space-y-2.5 overflow-y-scroll">
			<Card className="flex flex-col justify-between py-5 px-6">
				<div className="group flex items-baseline justify-between">
					<GradientText asChild>
						<a
							href={course.syncedUrl}
							target="_blank"
							rel="noreferrer"
							className={cn(
								"pb-5 text-6xl font-semibold",
								course.syncedUrl !== undefined &&
									"peer transition-all duration-150 hover:opacity-80 peer-hover:opacity-80"
							)}
						>
							{course.name}
						</a>
					</GradientText>

					{course.section && (
						<a
							href={course.syncedUrl}
							target="_blank"
							rel="noreferrer"
							className={cn(
								"relative bottom-[1px] mr-1 ml-3 flex-shrink-0 text-base font-medium leading-none opacity-60",
								course.syncedUrl !== undefined &&
									"peer transition-all duration-150 hover:opacity-50 peer-hover:opacity-50"
							)}
						>
							{course.section}
						</a>
					)}
				</div>

				<ClassTabs
					course={course}
					teacherEmailsPromise={teacherEmailsPromise}
					studentEmailsPromise={studentEmailsPromise}
					role={role}
					hasResources={hasResources}
				/>
			</Card>

			{children}
		</div>
	)
}
