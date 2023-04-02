import { useState } from "react";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import colors from "colors.cjs";
import { api } from "~/lib/trpc";
import DefaultLayout from "~/components/layout/DefaultLayout";
import clsx from "clsx";
import formatDate from "~/util/formatDate";
import useSelectedCourse from "~/util/useSelectedCourse";

// todo - make page protected
const Student: NextPage = () => {
	const router = useRouter();

	const studentEmail = router.asPath.split("/").at(-1) as string;

	const courseId = router.asPath.split("/").at(-3) as string;

	const [notFoundMessage, setNotFoundMessage] = useState<string>();

	const { role } = useSelectedCourse({
		selectedCourseId: useRouter().asPath.split("/").at(-3) as string,
	});

	if (role === "none")
		notFoundMessage === undefined &&
			setNotFoundMessage(
				"You either do not have access to this course or it does not exist."
			);

	if (role === "student") router.push(`/course/${courseId}`);

	const queryClient = api.useContext();

	const { data: student } = api.profile.get.useQuery(
		{
			email: studentEmail,
		},
		{
			initialData: () =>
				queryClient.roster.get
					.getData({ courseId })
					?.students.find(
						(student) => student.email === studentEmail
					),
			onError: (error) =>
				error.data?.code === "NOT_FOUND" &&
				notFoundMessage === undefined &&
				setNotFoundMessage("This assignment does not exist"),
		}
	);

	return (
		<DefaultLayout
			forceLoading={!student}
			selectedCourseId={courseId}
			notFoundMessage={notFoundMessage}
		>
			{student && (
				<div className="flex h-screen flex-col space-y-2.5 py-2.5 pr-3">
					<div className="flex items-center rounded-md bg-surface py-5 px-6">
						<img
							src={student.photo}
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

					<div className="flex flex-col rounded-md bg-surface py-5 px-6">
						<span className="font-medium italic opacity-60">
							Student insights coming soon...
						</span>
					</div>
				</div>
			)}
		</DefaultLayout>
	);
};

export default Student;
