import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"
import Card from "~/components/Card"
import SideBarToggle from "./SideBarToggle"
import NavigationButton from "./NavigationButton"
import Avatar from "~/components/Avatar"
import Heading from "~/components/Heading"

export default async function SideBar() {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const user = User({ email })

	const [profile, coursesTeaching, coursesEnrolled] = await Promise.all([
		user.get(),
		user.coursesTeaching(),
		user.coursesEnrolled(),
	])

	if (!profile) redirect("/signIn")

	return (
		<SideBarToggle>
			<Card className="flex h-full w-72 flex-col p-3 mobile:absolute mobile:inset-0 mobile:z-50 mobile:w-full">
				<NavigationButton
					text={profile.name}
					subtext={profile.email}
					photo={
						<Avatar
							src={profile.photo ?? undefined}
							name={profile.name}
							fallbackColor="secondary"
							className="h-full w-full"
						/>
					}
					href="/home"
				/>

				<div className="mr-[-8px] overflow-y-scroll">
					{coursesTeaching.length > 0 ||
					coursesEnrolled.length > 0 ? (
						<>
							{coursesTeaching.length > 0 && (
								<>
									<Heading
										size="small"
										className="my-1.5 ml-1.5"
									>
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
									<Heading
										size="small"
										className="my-1.5 ml-1.5"
									>
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
								Either ask a teacher for an invite or use the
								plus button in the upper right corner to create
								one
							</div>
						</>
					)}
				</div>
			</Card>
		</SideBarToggle>
	)
}
