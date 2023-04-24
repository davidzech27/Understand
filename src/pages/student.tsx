import { useEffect, useState } from "react";
import { type NextPage } from "next";
import { useRouter } from "next/router";
import colors from "colors.cjs";
import { api } from "~/client/api";
import DefaultLayout, {
	type DefaultLayoutRenderProps,
} from "~/client/modules/layout/DefaultLayout";

const StudentComponent: React.FC<DefaultLayoutRenderProps> = ({
	courses,
	currentCourseId,
	currentRole,
	onNotFound,
}) => {
	const router = useRouter();

	useEffect(() => {
		// not even sure if useEffect is necessary but having effects directly in the render function seems bad
		if (currentRole === "student")
			router.push(`/course/${currentCourseId}`);
	}, [currentRole, currentCourseId, router]);

	const course = courses.teaching.find(
		(course) => course.id === currentCourseId
	);

	const studentEmail = router.asPath.split("/").at(-1) as string;

	const student = course?.roster.students.find(
		(student) => student.email === studentEmail
	);

	useEffect(() => {
		if (student === undefined)
			onNotFound(
				"This student is either not enrolled in this class or does not exist"
			);
	}, [student, onNotFound]);

	return student ? (
		<div className="flex h-screen flex-col space-y-2.5 py-2.5 pr-3">
			<div className="flex items-center rounded-md border border-border bg-surface py-5 px-6">
				<img
					src={student.photo}
					alt={`${student.name}'s profile photo`}
					className="h-20 w-20 rounded-full"
				/>

				<div className="ml-5 flex flex-col">
					<span
						style={{
							background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
						}}
						className="mb-[1px] pb-1 text-3xl font-semibold leading-none opacity-90"
					>
						{student.name}
					</span>

					<span className="-mt-0.5 text-lg opacity-60">
						{student.email}
					</span>
				</div>
			</div>

			<div className="flex flex-col rounded-md border border-border bg-surface py-5 px-6 shadow-lg shadow-[#00000016]">
				<span className="font-medium italic opacity-60">
					Student insights coming soon...
				</span>
			</div>
		</div>
	) : null;
};

const Student: NextPage = () => {
	return <DefaultLayout Component={StudentComponent} />;
};

export default Student;
