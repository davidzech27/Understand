import Head from "next/head";
import SideBar from "./SideBar";
import { api, type RouterOutputs } from "~/lib/api";

type Props =
	| {
			routeName: "home";
			children: (props: {
				profile: RouterOutputs["profile"]["me"];
				coursesTeaching: RouterOutputs["courses"]["teaching"];
			}) => React.ReactNode;
	  }
	| {
			routeName: "course";
			courseId: string;
			children: (props: {
				profile: RouterOutputs["profile"]["me"];
				coursesTeaching: RouterOutputs["courses"]["teaching"];
				assignments: RouterOutputs["courses"]["assignments"];
				roster: RouterOutputs["courses"]["roster"];
			}) => React.ReactNode;
	  };

const DefaultLayout: React.FC<Props> = (props) => {
	const { data: profile } = api.profile.me.useQuery();

	const { data: coursesTeaching } = api.courses.teaching.useQuery();

	let assignments: RouterOutputs["courses"]["assignments"] | undefined;
	let roster: RouterOutputs["courses"]["roster"] | undefined;

	if (props.routeName === "course") {
		const { courseId } = props;

		assignments = api.courses.assignments.useQuery({
			courseId,
		}).data;

		roster = api.courses.roster.useQuery({
			courseId,
		}).data;
	}

	const loading = (
		<div className="flex h-screen w-full items-center justify-center bg-gradient-to-tr from-primary to-secondary pb-12">
			<span className="w-min text-[10rem] font-semibold text-white">
				Understand
			</span>
		</div>
	);

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

			{profile &&
			coursesTeaching &&
			(props.routeName !== "course" || (assignments && roster)) ? (
				<div className="bg-background flex min-h-screen">
					<SideBar
						currentRoute={props} // a bit weird
						profile={profile}
						coursesTeaching={coursesTeaching}
					/>

					<main className="flex-1">
						{(() => {
							if (props.routeName === "home") {
								return props.children({
									profile,
									coursesTeaching,
								});
							} else if (props.routeName === "course") {
								return props.children({
									profile,
									coursesTeaching,
									assignments: assignments!, // typescript can't narrow types here as expected
									roster: roster!,
								});
							}
						})()}
					</main>
				</div>
			) : (
				loading
			)}
		</>
	);
};

export default DefaultLayout;
