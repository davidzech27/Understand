import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import Card from "~/components/Card"
import User from "~/data/User"
import Avatar from "~/components/Avatar"
import GradientText from "~/components/GradientText"
import LinkButton from "~/components/LinkButton"

interface Params {
	courseId: string
	email: string
}

export async function generateMetadata({
	params: { email },
}: {
	params: Params
}) {
	email = decodeURIComponent(email)

	const name = (await User({ email }).get())?.name

	return {
		title: {
			template: `%s | ${name}`,
			default: name ?? "",
		},
	}
}

export default async function StudentLayout({
	children,
	params: { courseId, email },
}: {
	children: React.ReactNode
	params: Params
}) {
	email = decodeURIComponent(email)

	const [student, role] = await Promise.all([
		User({ email }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (student === undefined || role !== "teacher") notFound()

	return (
		<div className="-mr-2 flex h-full flex-col space-y-2.5 overflow-y-scroll">
			<Card className="flex flex-col justify-between py-3 px-4">
				<div className="flex space-x-1.5">
					<LinkButton
						href={`/class/${courseId}/student/${email}/insights`}
					>
						Insights
					</LinkButton>

					<LinkButton
						href={`/class/${courseId}/student/${email}/feedback`}
					>
						Feedback
					</LinkButton>
				</div>
			</Card>

			<Card className="flex items-center py-5 px-6">
				<Avatar
					src={student.photo}
					name={student.name}
					fallbackColor="primary"
					className="h-20 w-20 rounded-full"
				/>

				<div className="ml-5 flex flex-col">
					<GradientText asChild>
						<span className="select-text pb-2 text-4xl font-extrabold leading-none tracking-tight opacity-90 mobile:text-2xl">
							{student.name}
						</span>
					</GradientText>

					<span className="select-text text-base font-semibold leading-none text-black/70 mobile:mr-0 mobile:text-sm">
						{student.email}
					</span>
				</div>
			</Card>

			{children}
		</div>
	)
}
