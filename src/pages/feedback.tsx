import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "~/components/layout/DefaultLayout";
import colors from "colors.cjs";
import { api } from "~/lib/trpc";
import useSelectedCourse from "~/util/useSelectedCourse";
import { useRouter } from "next/router";

//! page probably not going to be used actually
// todo - make page protected
const Feedback: NextPage = () => {
	const { selectedCourse, role } = useSelectedCourse({
		selectedCourseId: useRouter().asPath.split("/").at(-3) as string,
	});

	return (
		<DefaultLayout>
			<div className="flex h-screen flex-col space-y-2.5 py-2.5 pr-3">
				<div className="flex h-full flex-col justify-between rounded-md bg-surface py-5 px-6">
					<span className="font-medium italic opacity-60">
						Feedback page coming soon...
					</span>
				</div>
			</div>
		</DefaultLayout>
	);
};

export default Feedback;
