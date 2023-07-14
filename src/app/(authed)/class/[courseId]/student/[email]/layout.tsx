import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import Card from "~/components/Card"
import User from "~/data/User"
import Avatar from "~/components/Avatar"
import GradientText from "~/components/GradientText"

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
			<Card className="flex items-center py-5 px-6">
				<Avatar
					src={student.photo}
					name={student.name}
					fallbackColor="primary"
					className="h-20 w-20 rounded-full"
				/>

				<div className="ml-5 flex flex-col">
					<GradientText asChild>
						<span className="mb-[1px] pb-1 text-3xl font-semibold leading-none opacity-90">
							{student.name}
						</span>
					</GradientText>

					<span className="-mt-0.5 text-lg opacity-60">
						{student.email}
					</span>
				</div>
			</Card>

			{children}
		</div>
	)
}
