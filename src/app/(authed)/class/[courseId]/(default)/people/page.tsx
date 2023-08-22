import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import Course from "~/data/Course"
import User from "~/data/User"
import Card from "~/components/Card"
import SectionList from "~/components/SectionList"
import UserItem from "~/components/UserItem"
import Heading from "~/components/Heading"

export const metadata = {
	title: "People",
}

export const runtime = "edge"

interface Params {
	courseId: string
}

export default async function PeoplePage({
	params: { courseId },
}: {
	params: Params
}) {
	const [role, teachers, students] = await Promise.all([
		getAuthOrThrow({ cookies: cookies() }).then(({ email }) =>
			User({ email }).courseRole({ id: courseId })
		),
		Course({ id: courseId }).teachers(),
		Course({ id: courseId }).students(),
	])

	if (role === "none") notFound()

	return (
		<Card className="flex-1 px-6 py-5">
			<SectionList
				sections={[
					{
						heading: "Teachers",
						items: teachers,
						renderItem: ({
							item: { email, name, photo, signedUp },
						}) => (
							<UserItem
								email={email}
								name={name}
								photo={photo}
								note={
									!signedUp ? "Not yet signed up" : undefined
								}
								disabled
								key={email}
							/>
						),
					},
					{
						heading: "Students",
						items: students,
						renderItem: ({
							item: { email, name, photo, signedUp },
						}) => (
							<UserItem
								email={email}
								name={name}
								photo={photo}
								href={
									role === "teacher" && signedUp
										? `/class/${courseId}/student/${email}/insights`
										: undefined
								}
								note={
									!signedUp ? "Not yet signed up" : undefined
								}
								disabled={role !== "teacher"}
								key={email}
							/>
						),
						renderEmpty: () => (
							<Heading size="large">
								This class doesn&apos;t have any students yet
							</Heading>
						),
					},
				]}
				headingSize="large"
			/>
		</Card>
	)
}
