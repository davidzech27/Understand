import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"
import Card from "~/components/Card"
import NavigationButton from "./NavigationButton"
import Avatar from "~/components/Avatar"
import Heading from "~/components/Heading"

export default async function SideBar() {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const [user, coursesTeaching, coursesEnrolled] = await Promise.all([
		User({ email }).get(),
		User({ email }).coursesTeaching(),
		User({ email }).coursesEnrolled(),
	])

	if (user === undefined) redirect("/signIn")

	return (
		<Card className="flex h-full w-full flex-col p-3">
			<NavigationButton
				text={user.name}
				subtext={user.email}
				photo={
					<Avatar
						src={user.photo ?? undefined}
						name={user.name}
						fallbackColor="secondary"
						className="h-full w-full"
					/>
				}
				href="/home"
			/>

			<div className="mr-[-8px] overflow-y-scroll">
				{coursesTeaching.length > 0 || coursesEnrolled.length > 0 ? (
					<>
						{coursesTeaching.length > 0 && (
							<>
								<Heading size="small" className="my-1.5 ml-1.5">
									Teaching
								</Heading>

								<div>
									{coursesTeaching.map((course) => (
										<NavigationButton
											text={course.name}
											subtext={
												course.section ?? undefined
											}
											photo={
												<Avatar
													src={undefined}
													name={course.name}
													fallbackColor="secondary"
													className="h-9 w-9"
												/>
											}
											href={`/class/${course.id}`}
											key={course.id}
										/>
									))}
								</div>
							</>
						)}

						{coursesEnrolled.length > 0 && (
							<>
								<Heading size="small" className="my-1.5 ml-1.5">
									Enrolled
								</Heading>

								<div>
									{coursesEnrolled.map((course) => (
										<NavigationButton
											text={course.name}
											subtext={
												course.section ?? undefined
											}
											photo={
												<Avatar
													src={undefined}
													name={course.name}
													fallbackColor="primary"
													className="h-9 w-9"
												/>
											}
											href={`/class/${course.id}`}
											key={course.id}
										/>
									))}
								</div>
							</>
						)}
					</>
				) : (
					<>
						<div className="mx-3 mt-3 text-xs font-medium leading-relaxed opacity-60">
							This is where you&apos;ll see your classes
						</div>

						<div className="mx-3 mt-1 text-xs leading-relaxed opacity-60">
							Either ask a teacher for an invite or use the plus
							button in the upper right corner to create one
						</div>
					</>
				)}
			</div>

			<div className="flex-1" />
			{user.schoolDistrictName !== undefined &&
			user.schoolName !== undefined ? (
				<NavigationButton
					text={user.schoolName}
					subtext={user.schoolDistrictName}
					photo={
						<Avatar
							src={undefined}
							name={user.schoolName}
							fallbackColor="primary"
							className="h-full w-full"
						/>
					}
					href="/landing"
				/>
			) : null}
		</Card>
	)
}
