"use client"

import SectionList from "~/components/SectionList"
import Heading from "~/components/Heading"
import UserItem from "~/components/UserItem"
import Card from "~/components/Card"

interface Props {
	courseId: string
	role: "teacher" | "student"
	roster: {
		teachers: (
			| {
					signedUp: true
					email: string
					name: string
					photo: string | undefined
			  }
			| {
					signedUp: false
					email: string
					name?: undefined
					photo?: undefined
			  }
		)[]
		students: (
			| {
					signedUp: true
					email: string
					name: string
					photo: string | undefined
			  }
			| {
					signedUp: false
					email: string
					name?: undefined
					photo?: undefined
			  }
		)[]
	}
}

const Roster: React.FC<Props> = ({ courseId, role, roster }) => {
	return (
		<Card className="flex-1 px-6 py-5">
			<SectionList
				sections={[
					{
						heading: "Teachers",
						items: roster.teachers,
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
							/>
						),
					},
					{
						heading: "Students",
						items: roster.students,
						renderItem: ({
							item: { email, name, photo, signedUp },
						}) => (
							<UserItem
								email={email}
								name={name}
								photo={photo}
								href={
									role === "teacher" && signedUp
										? `/class/${courseId}/student/${email}`
										: undefined
								}
								note={
									!signedUp ? "Not yet signed up" : undefined
								}
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

export default Roster
