import { useMemo, useState } from "react";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import colors from "colors.cjs";
import { RouterOutputs, api } from "~/lib/trpc";
import DefaultLayout from "~/components/layout/DefaultLayout";
import clsx from "clsx";
import formatDate from "~/util/formatDate";
import ToggleButton from "~/components/shared/ToggleButton";
import useStickyState from "~/util/useStickyState";
import useSelectedCourse from "~/util/useSelectedCourse";

// todo - figure out why students subpage only shows user if user is student
// todo - make page protected
// todo - replace subpage's useState with useStickyState (custom hook for saving state to local storage). include courseId in key
// todo - place links to corresponding google classroom pages in a bunch of places
const Course: NextPage = () => {
	const router = useRouter();

	const courseId = router.asPath.split("/").at(-1) as string;

	const { selectedCourse: course, role } = useSelectedCourse({
		selectedCourseId: courseId,
	});

	const [subpage, setSubpage] = useStickyState<
		"assignments" | "people" | "insights"
	>("assignments", `course:${courseId}:subpage`); // for some reason state is transfering from course to course

	const { data: assignments } = api.assignments.byCourse.useQuery({
		courseId,
	});

	const { data: roster } = api.roster.get.useQuery({
		courseId,
	});

	return (
		<DefaultLayout
			selectedCourseId={courseId}
			forceLoading={!assignments || !roster || !course}
		>
			{course && assignments && roster && (
				<div className="flex flex-col space-y-2.5 py-2.5 pr-3">
					<div className="flex flex-col justify-between rounded-md bg-surface py-5 px-6">
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
								onClick={() => setSubpage("assignments")}
								toggled={subpage === "assignments"}
							>
								Assignments
							</ToggleButton>

							<ToggleButton
								onClick={() => setSubpage("people")}
								toggled={subpage === "people"}
							>
								People
							</ToggleButton>

							{role === "teacher" && (
								<ToggleButton
									onClick={() => setSubpage("insights")}
									toggled={subpage === "insights"}
								>
									Insights
								</ToggleButton>
							)}
						</div>
					</div>

					<div className="flex flex-col rounded-md bg-surface py-5 px-6">
						{subpage === "assignments" ? (
							<div className="space-y-2.5">
								{assignments.length > 0 ? (
									assignments.map((assignment) => (
										<Link
											href={`/course/${courseId}/assignment/${assignment.id}`}
											key={assignment.id}
											className="flex h-20 items-center justify-between rounded-md border-[0.75px] border-border pl-6 pr-8 transition-colors duration-150 hover:bg-surface-hover"
										>
											<span className="text-lg font-medium opacity-90">
												{assignment.title}
											</span>

											{assignment.state ===
											"PUBLISHED" ? (
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
									))
								) : (
									<span className="font-medium italic opacity-60">
										This is where you&apos;ll see created
										assignments
									</span>
									// changed to "assigned" on student's end
								)}
							</div>
						) : subpage === "people" ? (
							<div>
								<div className="ml-1 mb-2 text-lg font-medium opacity-60">
									Teachers
								</div>

								<div className="space-y-2.5">
									{roster.teachers.map((teacher) => (
										<div
											key={teacher.email}
											className="flex h-20 items-center rounded-md border-[0.75px] border-border pl-6 pr-8"
										>
											<img
												src={teacher.photo}
												className="h-11 w-11 rounded-full"
											/>

											<div className="ml-3 flex flex-col">
												<span className="mb-[1px] font-medium leading-none opacity-90">
													{teacher.name}
												</span>

												<span className="text-sm opacity-60">
													{teacher.email}
												</span>
											</div>
										</div>
									))}
								</div>

								{roster.students.length > 0 ? (
									<>
										<div className="ml-1 mb-2 mt-2.5 text-lg font-medium opacity-60">
											Students
										</div>

										<div className="space-y-2.5">
											{roster.students.map((student) => {
												const inner = (
													<>
														<img
															src={student.photo}
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

												if (role === "teacher") {
													return (
														<Link
															href={`/course/${courseId}/student/${student.email}`}
															key={student.email}
															className="flex h-20 items-center rounded-md border-[0.75px] border-border pl-6 pr-8 transition-colors duration-150 hover:bg-surface-hover"
														>
															{inner}
														</Link>
													);
												} else {
													return (
														<div
															key={student.email}
															className="flex h-20 items-center rounded-md border-[0.75px] border-border pl-6 pr-8"
														>
															{inner}
														</div>
													);
												}
											})}
										</div>
									</>
								) : (
									<span className="font-medium italic opacity-60">
										This class doesn&apos;t have any
										students yet
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
			)}
		</DefaultLayout>
	);
};

export default Course;
