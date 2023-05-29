import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import PreviewDisplay from "~/components/PreviewDisplay"
import { getAuthOrThrow } from "~/auth/jwt"
import Card from "~/components/Card"
import Avatar from "~/components/Avatar"
import User from "~/data/User"

const SideBar = async () => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const user = User({ email })

	const [profile, courses] = await Promise.all([user.get(), user.courses()])

	if (!profile) redirect("/signIn")

	return (
		<Card className="flex h-full w-72 flex-col py-3 px-3">
			<PreviewDisplay
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
				href="/home" // change later once there is a separate home and account buttons
			/>

			<div className="mr-[-8px] overflow-y-scroll">
				{courses.teaching.length > 0 || courses.enrolled.length > 0 ? (
					<>
						{courses.teaching.length > 0 && (
							<>
								<span className="my-1.5 ml-1.5 text-sm font-medium opacity-60">
									Teaching
								</span>
								<div>
									{courses.teaching.map((course) => (
										<PreviewDisplay
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

						{courses.enrolled.length > 0 && (
							<>
								<span className="my-1.5 ml-1.5 text-sm font-medium opacity-60">
									Enrolled
								</span>
								<div>
									{courses.enrolled.map((course) => (
										<PreviewDisplay
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
		</Card>
	)
}

export default SideBar
