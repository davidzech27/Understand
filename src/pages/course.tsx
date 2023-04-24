import { useState } from "react";
import { type NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import colors from "colors.cjs";
import { api } from "~/client/api";
import DefaultLayout, {
	type DefaultLayoutRenderProps,
} from "~/client/modules/layout/DefaultLayout";
import formatDate from "~/client/modules/shared/formatDate";
import ToggleButton from "~/client/modules/shared/ToggleButton";
import useStickyState from "~/client/modules/shared/useStickyState";
import RowList from "~/client/modules/shared/RowList";
import RowItem from "~/client/modules/shared/RowItem";

// consider adding borders or shadows on surfaces
// todo - figure out why students subpage only shows current user if user is student
// todo - place links to corresponding google classroom pages in a bunch of places
const CourseComponent: React.FC<DefaultLayoutRenderProps> = ({
	courses,
	currentCourseId,
	currentRole,
}) => {
	const [subpage, setSubpage] = useStickyState<
		"assignments" | "people" | "insights"
	>("assignments", `course:${currentCourseId}:subpage`);

	const course =
		currentRole !== "none" // never will be false
			? courses[
					({ teacher: "teaching", student: "enrolled" } as const)[
						currentRole
					] // checking in both places so that student knows if the assignment exists or not
			  ].find((course) => course.id === currentCourseId)
			: undefined;

	const router = useRouter();

	return course ? (
		<div className="flex min-h-full flex-col space-y-2.5 py-2.5 pr-3">
			<div className="flex flex-col justify-between rounded-md border border-border bg-surface py-5 px-6">
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
						<span className="relative bottom-[1px] mr-3 ml-6 flex-shrink-0 text-lg font-medium leading-none opacity-60">
							{course.section}
						</span>
					)}
				</div>

				<div className="flex space-x-1.5">
					<ToggleButton
						onPress={() => setSubpage("assignments")}
						toggled={subpage === "assignments"}
					>
						Assignments
					</ToggleButton>

					<ToggleButton
						onPress={() => setSubpage("people")}
						toggled={subpage === "people"}
					>
						People
					</ToggleButton>

					{currentRole === "teacher" && (
						<ToggleButton
							onPress={() => setSubpage("insights")}
							toggled={subpage === "insights"}
						>
							Insights
						</ToggleButton>
					)}
				</div>
			</div>

			<div className="flex flex-1 flex-col rounded-md border border-border bg-surface py-5 px-6 shadow-lg shadow-[#00000016]">
				{subpage === "assignments" ? (
					<RowList
						items={course.assignments}
						onAction={(id) =>
							router.push(
								`/course/${course.id}/${
									currentRole === "teacher"
										? "assignment"
										: "feedback"
								}/${id}`
							)
						}
						renderEmptyState={() => (
							<span className="font-medium italic opacity-60">
								{`This is where you'll see ${
									currentRole === "teacher"
										? "created"
										: "assigned"
								} assignments`}
							</span>
						)}
					>
						{({ item: assignment }) => (
							<RowItem id={assignment.id}>
								<Link
									href={`/course/${course.id}/${
										currentRole === "teacher"
											? "assignment"
											: "feedback"
									}/${assignment.id}`}
									className="flex h-20 items-center justify-between"
								>
									<span className="text-lg font-medium opacity-90">
										{assignment.title}
									</span>

									{assignment.state === "PUBLISHED" ? (
										<span className="opacity-60">
											{assignment.dueDate
												? `Due ${formatDate(
														assignment.dueDate
												  )}`
												: "No due date"}
										</span>
									) : (
										<span className="italic opacity-60">
											Draft
										</span>
									)}
								</Link>
							</RowItem>
						)}
					</RowList>
				) : subpage === "people" ? (
					<div>
						<div className="ml-1 mb-2 text-lg font-medium opacity-60">
							Teachers
						</div>

						<RowList items={course.roster.teachers}>
							{({ item: teacher }) => (
								<RowItem
									id={teacher.email ?? teacher.name}
									disabled
								>
									<div className="flex h-20 items-center">
										<img
											src={teacher.photo}
											alt={`${teacher.name}'s profile photo`}
											className="h-11 w-11 rounded-full"
										/>

										<div className="ml-3 flex flex-col">
											<span className="mb-[1px] select-text font-medium leading-none opacity-90">
												{teacher.name}
											</span>

											{teacher.email !== undefined && (
												<span className="select-text text-sm opacity-60">
													{teacher.email}
												</span>
											)}
										</div>
									</div>
								</RowItem>
							)}
						</RowList>

						{course.roster.students.length > 0 ? (
							<>
								<div className="ml-1 mb-2 mt-2.5 text-lg font-medium opacity-60">
									Students
								</div>

								<RowList
									items={course.roster.students}
									onAction={
										currentRole === "teacher"
											? (email) =>
													router.push(
														`/course/${course.id}/student/${email}`
													)
											: undefined
									}
								>
									{({ item: student }) => {
										const inner = (
											<>
												<img
													src={student.photo}
													alt={`${student.name}'s profile photo`}
													className="h-11 w-11 rounded-full"
												/>

												<div className="ml-3 flex flex-col">
													<span className="mb-[1px] font-medium leading-none opacity-90">
														{student.name}
													</span>

													<span className="text-sm opacity-60">
														{student.email}
													</span>
												</div>
											</>
										);

										if (currentRole === "teacher") {
											return (
												<RowItem id={student.email}>
													<Link
														href={`/course/${course.id}/student/${student.email}`}
														className="flex h-20 items-center"
													>
														{inner}
													</Link>
												</RowItem>
											);
										} else {
											return (
												<RowItem
													id={student.email}
													disabled
												>
													<div className="flex h-20 items-center">
														{inner}
													</div>
												</RowItem>
											);
										}
									}}
								</RowList>
							</>
						) : (
							<span className="font-medium italic opacity-60">
								This class doesn&apos;t have any students yet
							</span>
						)}
					</div>
				) : (
					<span className="font-medium italic opacity-60">
						Classroom insights coming soon...
					</span>
				)}
			</div>
		</div>
	) : null;
};

const Course: NextPage = () => {
	return <DefaultLayout Component={CourseComponent} />;
};

export default Course;
