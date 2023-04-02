import Head from "next/head";
import SideBar from "./SideBar";
import { api } from "~/lib/trpc";

type Props = {
	children: React.ReactNode;
	selectedCourseId?: string;
	forceLoading?: boolean;
};

const DefaultLayout: React.FC<Props> = ({
	children,
	selectedCourseId,
	forceLoading,
}) => {
	const { data: profile } = api.profile.me.useQuery();

	const { data: coursesTeaching } = api.courses.teaching.useQuery(undefined, {
		onSuccess: (courses) => {
			for (const course of courses) {
				queryClient.assignments.byCourse
					.ensureData({
						courseId: course.id,
					})
					.catch(console.error);

				queryClient.roster.get
					.ensureData({
						courseId: course.id,
					})
					.catch(console.error);
			}
		},
	});

	const { data: coursesEnrolled } = api.courses.enrolled.useQuery(undefined, {
		onSuccess: (courses) => {
			for (const course of courses) {
				queryClient.assignments.byCourse
					.ensureData({
						courseId: course.id,
					})
					.catch(console.error);

				queryClient.roster.get
					.ensureData({
						courseId: course.id,
					})
					.catch(console.error);
			}
		},
	});

	const queryClient = api.useContext();

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

			{!forceLoading && profile && coursesTeaching && coursesEnrolled ? (
				<div className="flex min-h-screen bg-background">
					<SideBar
						selectedCourseId={selectedCourseId}
						profile={profile}
						coursesTeaching={coursesTeaching}
						coursesEnrolled={coursesEnrolled}
					/>

					<main className="flex-1">{children}</main>
				</div>
			) : (
				<div className="flex h-screen w-full items-center justify-center bg-gradient-to-tr from-primary to-secondary pb-12">
					<span className="w-min text-[10rem] font-semibold text-white">
						Understand
					</span>
				</div>
			)}
		</>
	);
};

export default DefaultLayout;
