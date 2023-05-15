import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import colors from "~/colors.cjs"
import SegmentTabs from "./SegmentTabs"
import Card from "~/components/Card"
import User from "~/data/User"
import Course from "~/data/Course"
import { getAuthOrThrow } from "~/auth/jwt"

interface Params {
	id: string
}

export const generateMetadata = async ({
	params: { id },
}: {
	params: Params
}) => {
	const name = (await Course({ id }).get())?.name

	return {
		template: `%s | ${name}`,
		default: name,
	}
}

const ClassLayout = async ({
	children,
	params: { id },
}: {
	children: React.ReactNode
	params: Params
}) => {
	const [course, role] = await Promise.all([
		Course({ id }).get(),
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id })
		),
	])

	if (course === undefined || role === "none") notFound()

	return (
		<div className="flex h-full flex-col space-y-2.5">
			<Card className="flex flex-col justify-between py-5 px-6">
				<div className="flex items-baseline justify-between">
					<span
						style={{
							background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
						}}
						className="pb-5 text-6xl font-semibold"
					>
						{course.name}
					</span>

					{course.section && (
						<span className="relative bottom-[1px] mr-1 ml-3 flex-shrink-0 text-base font-medium leading-none opacity-60">
							{course.section}
						</span>
					)}
				</div>

				<SegmentTabs course={course} role={role} />
			</Card>

			{children}
		</div>
	)
}

export default ClassLayout
