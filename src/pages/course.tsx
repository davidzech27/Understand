import { useState } from "react";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import colors from "colors.cjs";
import { api } from "~/lib/api";
import DefaultLayout from "~/components/layout/DefaultLayout";
import clsx from "clsx";

// todo - make page protected
const Course: NextPage = () => {
	const router = useRouter();

	const courseId = router.asPath.split("/").at(-1) as string;

	const [subpage, setSubpage] = useState<"assignments" | "students">(
		"assignments"
	);

	return (
		<DefaultLayout
			routeName="course"
			courseId={courseId}
			children={({ profile, coursesTeaching, assignments, roster }) => {
				const course = coursesTeaching.find(
					(course) => course.id === courseId
				);

				if (!course) {
					router.push("/home"); // shouldn't happen
					return null;
				}

				return (
					<div className="flex flex-col space-y-2.5 py-2.5 pr-3">
						<div className="bg-surface flex flex-col rounded-md py-5 px-6">
							<div className="flex items-baseline justify-between">
								<span
									style={{
										background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
										WebkitBackgroundClip: "text",
										backgroundClip: "text",
										color: "transparent",
									}}
									className="text-6xl font-semibold"
								>
									{course.name}
								</span>

								{course.section && (
									<span className="relative bottom-[1px] mr-3 text-xl font-medium leading-none opacity-60">
										{course.section}
									</span>
									// could look better
								)}
							</div>

							<div className="mt-5 flex space-x-1.5">
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
									onClick={() => setSubpage("students")}
									className={clsx(
										"select-none rounded-md py-2.5 px-6 text-lg font-medium transition-all duration-150",
										subpage === "students"
											? "bg-surface-selected hover:bg-surface-selected-hover opacity-80"
											: "hover:bg-surface-hover opacity-60 hover:opacity-80"
									)}
								>
									Students
								</button>
							</div>
						</div>

						<div className="bg-surface flex h-screen flex-col rounded-md py-3 px-3">
							{assignments.map((assignment) => (
								<div>{JSON.stringify(assignment, null, 4)}</div>
							))}

							{roster.teachers.map((teacher) => (
								<div>{JSON.stringify(teacher, null, 4)}</div>
							))}

							{roster.students.map((student) => (
								<div>{JSON.stringify(student, null, 4)}</div>
							))}
						</div>
					</div>
				);
			}}
		/>
	);
};

export default Course;
