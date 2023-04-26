import Link from "next/link";
import PreviewDisplay from "../shared/PreviewDisplay";
import { type RouterOutputs } from "~/client/api";
import colors from "colors.cjs";

interface Props {
	currentCourseId: string | undefined;
	profile: {
		email: string;
		name: string;
		photo?: string;
	};
	courses: RouterOutputs["courses"]["all"];
}

const SideBar: React.FC<Props> = ({ currentCourseId, profile, courses }) => {
	return (
		<nav className="h-screen w-72">
			<div className="fixed h-screen w-72 px-3 py-2.5">
				<div className="flex h-full flex-col rounded-md border border-border bg-surface py-3 px-3 shadow-lg shadow-[#00000016]">
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
							profile.photo !== undefined ? (
								<img
									src={profile.photo}
									alt="Your profile photo"
									className="h-full w-full rounded-full"
								/>
							) : (
								<div className="h-full w-full" />
							)
						}
						href="/home" // change later once there is a separate home and account buttons
						selected={currentCourseId === undefined}
					/>

					<div className="mr-[-8px] overflow-y-scroll">
						{courses.teaching.length > 0 ||
						courses.enrolled.length > 0 ? (
							<>
								{courses.teaching.length > 0 && (
									<>
										<span className="my-1.5 ml-1.5 text-sm font-medium opacity-60">
											Teaching
										</span>
										<div>
											{courses.teaching.map((course) => (
												<PreviewDisplay
													text={course.name}
													subtext={course.section}
													photo={
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-[1.16rem] text-white">
															{course.name[0]?.toUpperCase()}
														</div>
													}
													href={`/course/${course.id}`}
													selected={
														currentCourseId ===
														course.id
													}
													key={course.id}
												/>
											))}
										</div>
									</>
								)}

								{courses.enrolled.length > 0 && (
									<>
										<span className="my-1.5 ml-1.5 text-sm font-medium opacity-60">
											Enrolled
										</span>
										<div>
											{courses.enrolled.map((course) => (
												<PreviewDisplay
													text={course.name}
													subtext={course.section}
													photo={
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[1.16rem] text-white">
															{course.name[0]?.toUpperCase()}
														</div>
													}
													href={`/course/${course.id}`}
													selected={
														currentCourseId ===
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
								You&apos;re not teaching or enrolled in any
								classes
							</span>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};

export default SideBar;
