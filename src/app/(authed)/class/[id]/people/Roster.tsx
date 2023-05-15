"use client"
import Link from "next/link"

import Card from "~/components/Card"
import Row from "~/components/Row"
import Avatar from "~/components/Avatar"

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
		<Card className="flex flex-1 flex-col py-5 px-6">
			<div>
				<div className="ml-1 mb-2 text-lg font-medium opacity-60">
					Teachers
				</div>

				<Row.List items={roster.teachers}>
					{({ item: teacher }) => (
						<Row.Item key={teacher.email ?? teacher.name} disabled>
							<div className="flex h-20 items-center justify-between">
								<div className="flex items-center">
									<Avatar
										src={teacher.photo}
										name={teacher.name ?? teacher.email}
										fallbackColor="secondary"
										className="h-11 w-11 rounded-full"
									/>

									<div className="ml-3 flex flex-col">
										<span className="mb-[1px] select-text font-medium leading-none opacity-90">
											{teacher.name ?? teacher.email}
										</span>

										{teacher.name && (
											<span className="select-text text-sm opacity-60">
												{teacher.email}
											</span>
										)}
									</div>
								</div>

								{!teacher.signedUp && (
									<span className="italic opacity-60">
										Not yet signed up
									</span>
								)}
							</div>
						</Row.Item>
					)}
				</Row.List>

				{roster.students.length > 0 ? (
					<>
						<div className="ml-1 mb-2 mt-2.5 text-lg font-medium opacity-60">
							Students
						</div>

						<Row.List items={roster.students}>
							{({ item: student }) => {
								const inner = (
									<>
										<div className="flex items-center">
											<Avatar
												src={student.photo}
												name={
													student.name ??
													student.email
												}
												fallbackColor="primary"
												className="h-11 w-11 rounded-full"
											/>

											<div className="ml-3 flex flex-col">
												<span className="mb-[1px] font-medium leading-none opacity-90">
													{student.name ??
														student.email}
												</span>

												{student.name && (
													<span className="text-sm opacity-60">
														{student.email}
													</span>
												)}
											</div>
										</div>

										{!student.signedUp && (
											<span className="italic opacity-60">
												Not yet signed up
											</span>
										)}
									</>
								)

								if (role === "teacher" && student.signedUp) {
									return (
										<Row.Item key={student.email}>
											<Link
												href={`/class/${courseId}/student/${student.email}`}
												className="flex h-20 items-center justify-between"
											>
												{inner}
											</Link>
										</Row.Item>
									)
								} else {
									return (
										<Row.Item key={student.email} disabled>
											<div className="flex h-20 items-center justify-between">
												{inner}
											</div>
										</Row.Item>
									)
								}
							}}
						</Row.List>
					</>
				) : (
					<span className="font-medium italic opacity-60">
						This class doesn&apos;t have any students yet
					</span>
				)}
			</div>
		</Card>
	)
}

export default Roster
