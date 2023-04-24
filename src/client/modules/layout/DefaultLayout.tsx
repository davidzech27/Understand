import { useMemo, useState } from "react";
import Head from "next/head";
import SideBar from "./SideBar";
import { api, type RouterOutputs } from "~/client/api";
import { useRouter } from "next/router";

export type DefaultLayoutRenderProps = {
	profile: RouterOutputs["profile"]["me"];
	courses: RouterOutputs["courses"]["all"];
	currentCourseId: string | undefined;
	currentRole: "teacher" | "student" | "none";
	onNotFound: (message: string) => void;
};

type Props = {
	Component: React.FC<DefaultLayoutRenderProps>;
};

const DefaultLayout: React.FC<Props> = ({ Component }) => {
	const router = useRouter();

	const { data: profile } = api.profile.me.useQuery(undefined, {
		onError: (error) => {
			if (error.data?.code === "UNAUTHORIZED") router.push("/signIn");
		},
	});

	const currentCourseId = router.asPath.startsWith("/course/")
		? router.asPath.split("/")[2]
		: undefined;

	const { data: courses } = api.courses.all.useQuery();

	const currentRole = useMemo(() => {
		if (courses === undefined) return undefined;

		if (currentCourseId === undefined) return "none";

		if (
			courses.teaching.find((course) => course.id === currentCourseId) !==
			undefined
		)
			return "teacher";

		if (
			courses.enrolled.find((course) => course.id === currentCourseId) !==
			undefined
		)
			return "student";

		setNotFoundMessage(
			"You either do not have access to this course or it does not exist."
		);

		return undefined;
	}, [courses, currentCourseId]);

	const [notFoundMessage, setNotFoundMessage] = useState<string>();

	return (
		<>
			<Head>
				<title>Understand</title>
				<meta
					name="description"
					content="Instant student feedback and teacher-centric insights platform"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			{notFoundMessage !== undefined ? (
				<div className="flex h-screen w-full flex-col items-center bg-gradient-to-tr from-primary to-secondary">
					<div className="flex-[0.875]" />

					<span className="cursor-default px-48 text-[5rem] font-semibold leading-none text-white">
						{notFoundMessage}
					</span>

					<div className="flex-1" />
				</div>
			) : profile && courses && currentRole ? (
				<div className="flex min-h-screen bg-background">
					<SideBar
						currentCourseId={currentCourseId}
						profile={profile}
						courses={courses}
					/>

					<main className="flex-1">
						<Component
							profile={profile}
							courses={courses}
							currentCourseId={currentCourseId}
							currentRole={currentRole}
							onNotFound={setNotFoundMessage}
						/>
					</main>
				</div>
			) : (
				<div className="flex h-screen w-full flex-col items-center bg-gradient-to-tr from-primary to-secondary">
					<div className="flex-[0.875]" />

					<span className="w-min cursor-default text-[10rem] font-semibold leading-none text-white">
						Understand
					</span>

					<div className="flex-1" />
				</div>
			)}
		</>
	);
};

export default DefaultLayout;
