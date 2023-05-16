import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import colors from "~/colors.cjs"
import Card from "~/components/Card"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"
import Avatar from "~/components/Avatar"

interface Params {
	courseId: string
	email: string
}

export const generateMetadata = async ({
	params: { email },
}: {
	params: Params
}) => {
	const name = (await User({ email }).get())?.name

	return {
		template: `%s | ${name}`,
		default: name,
	}
}

const StudentLayout = async ({
	children,
	params: { courseId, email },
}: {
	children: React.ReactNode
	params: Params
}) => {
	email = decodeURIComponent(email)

	const [student, role] = await Promise.all([
		User({ email }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
	])

	if (student === undefined || role !== "teacher") notFound()

	return (
		<div className="flex h-full flex-col space-y-2.5 overflow-y-scroll">
			<Card className="flex items-center py-5 px-6">
				<Avatar
					src={student.photo}
					name={student.name}
					fallbackColor="primary"
					className="h-20 w-20 rounded-full"
				/>

				<div className="ml-5 flex flex-col">
					<span
						style={{
							background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
						}}
						className="mb-[1px] pb-1 text-3xl font-semibold leading-none opacity-90"
					>
						{student.name}
					</span>

					<span className="-mt-0.5 text-lg opacity-60">
						{student.email}
					</span>
				</div>
			</Card>

			{children}
		</div>
	)
}

export default StudentLayout
