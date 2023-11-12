import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import ClassTabs from "./ClassTabs"
import Card from "~/components/Card"
import User from "~/data/User"
import Course from "~/data/Course"

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

	const [course, inviteCode, role] = await Promise.all([
		Course({ id: courseId }).get(),
		Course({ id: courseId }).inviteCode(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId }),
		),
	])

	if (course === undefined || role === "none") notFound()

	return (
		<div className="-mr-2 flex h-full flex-col space-y-2.5 overflow-y-scroll">
			<Card className="flex flex-col justify-between px-4 py-3">
				<ClassTabs
					course={course}
					teacherEmailsPromise={teacherEmailsPromise}
					studentEmailsPromise={studentEmailsPromise}
					role={role}
					inviteCode={role === "teacher" ? inviteCode : undefined}
				/>
			</Card>

			{children}
		</div>
	)
}
