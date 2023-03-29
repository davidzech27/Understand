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
const Assignment: NextPage = () => {
	const router = useRouter();

	const assignmentId = router.asPath.split("/").at(-1) as string;

	const courseId = router.asPath.split("/").at(-3) as string;

	const queryClient = api.useContext();

	const { data: assignment } = api.assignments.get.useQuery(
		{
			id: assignmentId,
			courseId,
		},
		{
			initialData: () =>
				queryClient.assignments.byCourse
					.getData({ courseId })
					?.find((assignment) => assignment.id === assignmentId),
		}
	);

	const [subpage, setSubpage] = useState<"feedback" | "insights">("feedback");

	return (
		<DefaultLayout forceLoading={!assignment} selectedCourseId={courseId}>
			{assignment && (
				<div className="flex h-screen flex-col space-y-2.5 py-2.5 pr-3">
					<div className="bg-surface flex flex-col rounded-md py-5 px-6">
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
								{assignment.title}
							</span>

							{assignment.state === "PUBLISHED" ? (
								<span className="relative bottom-[1px] mr-3 ml-6 flex-shrink-0 text-lg font-medium leading-none opacity-60">
									{assignment.dueDate
										? `Due ${formatDate(
												assignment.dueDate
										  )}`
										: "No due date"}
								</span>
							) : (
								<span className="relative bottom-[1px] mr-3 ml-6 flex-shrink-0 text-lg font-medium italic leading-none opacity-60">
									Draft
								</span>
							)}
						</div>

						<p className="px-1 pb-5 text-sm opacity-80">
							{assignment.description}
						</p>

						<div className="flex space-x-1.5">
							<button
								onClick={() => setSubpage("feedback")}
								className={clsx(
									"select-none rounded-md py-2.5 px-6 text-lg font-medium transition-all duration-150",
									subpage === "feedback"
										? "bg-surface-selected hover:bg-surface-selected-hover opacity-80"
										: "hover:bg-surface-hover opacity-60 hover:opacity-80"
								)}
							>
								Feedback
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

					<div className="bg-surface flex flex-1 flex-col rounded-md py-5 px-6">
						{subpage === "feedback" ? (
							<div></div>
						) : (
							<span className="font-medium italic opacity-60">
								Assignment insights coming soon...
							</span>
						)}
					</div>
				</div>
			)}
		</DefaultLayout>
	);
};

export default Assignment;
