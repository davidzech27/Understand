import { useState } from "react";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import colors from "colors.cjs";
import { api } from "~/lib/api";
import DefaultLayout from "~/components/layout/DefaultLayout";
import clsx from "clsx";
import formatDate from "~/util/formatDate";

// todo - make page protected
// todo - replace subpage's useState with useStickyState (custom hook for saving state to local storage). include courseId in key
// todo - place links to corresponding google classroom pages in a bunch of places
const Course: NextPage = () => {
	const router = useRouter();

	const courseId = router.asPath.split("/").at(-1) as string;

	const [subpage, setSubpage] = useState<
		"assignments" | "people" | "insights"
	>("assignments");

	const { data: coursesTeaching } = api.courses.teaching.useQuery();

	const course = coursesTeaching?.find((course) => course.id === courseId);

	if (coursesTeaching && !course) {
		router.push("/home"); // happens if course isn't found. change later
		return null;
	}

	const { data: assignments } = api.assignments.byCourse.useQuery({
		courseId,
	});

	const { data: roster } = api.roster.get.useQuery({
		courseId,
	});

	return (
		<DefaultLayout
			selectedCourseId={courseId}
			forceLoading={!assignments || !roster}
		>
			{course && assignments && roster && (
				<div className="flex flex-col space-y-2.5 py-2.5 pr-3">
					<div className="bg-surface flex flex-col justify-between rounded-md py-5 px-6">
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
							<button
								onClick={() => setSubpage("assignments")}
								className={clsx(
									"select-none rounded-md py-2.5 px-6 text-lg font-medium transition-all duration-150",
									subpage === "assignments"
										? "bg-surface-selected hover:bg-surface-selected-hover opacity-80"
										: "hover:bg-surface-hover opacity-60 hover:opacity-80"
								)}
							>
								Assignments
							</button>

							<button
								onClick={() => setSubpage("people")}
								className={clsx(
									"select-none rounded-md py-2.5 px-6 text-lg font-medium transition-all duration-150",
									subpage === "people"
										? "bg-surface-selected hover:bg-surface-selected-hover opacity-80"
										: "hover:bg-surface-hover opacity-60 hover:opacity-80"
								)}
							>
								People
							</button>

							<button
								onClick={() => setSubpage("insights")}
								className={clsx(
									"select-none rounded-md py-2.5 px-6 text-lg font-medium transition-all duration-150",
									subpage === "insights"
										? "bg-surface-selected hover:bg-surface-selected-hover opacity-80"
										: "hover:bg-surface-hover opacity-60 hover:opacity-80"
								)}
							>
								Insights
							</button>
						</div>
					</div>

					<div className="bg-surface flex flex-col rounded-md py-5 px-6">
						{subpage === "assignments" ? (
							<div className="space-y-2.5">
								{assignments.length > 0 ? (
									assignments.map((assignment) => (
										<Link
											href={`/course/${courseId}/assignment/${assignment.id}`}
											key={assignment.id}
											className="hover:bg-surface-hover border-border flex h-20 items-center justify-between rounded-md border-[0.75px] pl-6 pr-8 transition-colors duration-150"
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
										This is where you'll see created
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
											className="border-border flex h-20 items-center rounded-md border-[0.75px] pl-6 pr-8"
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
											{roster.students.map((student) => (
												<Link
													href={`/course/${courseId}/student/${student.email}`}
													key={student.email}
													className="hover:bg-surface-hover border-border flex h-20 items-center rounded-md border-[0.75px] pl-6 pr-8 transition-colors duration-150"
												>
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
												</Link>
											))}
										</div>
									</>
								) : (
									<span className="font-medium italic opacity-60">
										This class doesn't have any students yet
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
