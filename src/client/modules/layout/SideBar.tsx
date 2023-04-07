import Link from "next/link";
import PreviewDisplay from "../../../components/shared/PreviewDisplay";
import colors from "colors.cjs";

interface Props {
	selectedCourseId: string | undefined;
	profile: {
		email: string;
		name: string;
		photo?: string;
	};
	coursesTeaching: {
		id: string;
		name: string;
		section?: string;
	}[];
	coursesEnrolled: {
		id: string;
		name: string;
		section?: string;
	}[];
}

const SideBar: React.FC<Props> = ({
	selectedCourseId,
	profile,
	coursesTeaching,
	coursesEnrolled,
}) => {
	return (
		<nav className="h-screen w-80">
			<div className="fixed h-screen w-80 px-3 py-2.5">
				<div className="flex h-full select-none flex-col rounded-md bg-surface py-3 px-3">
					<Link
						href="/" // possibly redirect to about page in future
						className="flex justify-center rounded-md pt-1 pb-1.5 transition-opacity duration-150 hover:opacity-75"
					>
						<span
							style={{
								background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
								WebkitBackgroundClip: "text",
								backgroundClip: "text",
								color: "transparent",
							}}
							className="cursor-pointer text-2xl font-semibold"
						>
							Understand
						</span>
					</Link>

					<PreviewDisplay
						text={profile.name}
						subtext={profile.email}
						photo={
							<img
								className="h-full w-full rounded-full"
								src={profile.photo}
							/>
						}
						href="/home" // change later once there is a separate home and account buttons
						selected={selectedCourseId === undefined}
					/>

					{coursesTeaching.length > 0 ||
					coursesEnrolled.length > 0 ? (
						<>
							{coursesTeaching.length > 0 && (
								<>
									<span className="my-1.5 ml-1.5 text-sm font-medium opacity-60">
										Teaching
									</span>
									<div>
										{coursesTeaching.map((course) => (
											<PreviewDisplay
												text={course.name}
												subtext={course.section}
												photo={
													<div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-[1.16rem] text-white">
														{course.name[0]?.toUpperCase()}
													</div>
												}
												href={`/course/${course.id}`}
												selected={
													selectedCourseId ===
													course.id
												}
												key={course.id}
											/>
										))}
									</div>
								</>
							)}

							{coursesEnrolled.length > 0 && (
								<>
									<span className="my-1.5 ml-1.5 text-sm font-medium opacity-60">
										Enrolled
									</span>
									<div>
										{coursesEnrolled.map((course) => (
											<PreviewDisplay
												text={course.name}
												subtext={course.section}
												photo={
													<div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-[1.16rem] text-white">
														{course.name[0]?.toUpperCase()}
													</div>
												}
												href={`/course/${course.id}`}
												selected={
													selectedCourseId ===
													course.id
												}
												key={course.id}
											/>
										))}
									</div>
								</>
							)}
						</>
					) : (
						<span className="my-1.5 ml-1.5 text-sm font-medium opacity-60">
							You&apos;re not teaching or enrolled in any classes
						</span>
					)}
					{/* later only have message if not teaching or enrolled */}
				</div>
			</div>
		</nav>
	);
};

export default SideBar;
