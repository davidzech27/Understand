"use client"
import Link from "next/link"

import env from "env.mjs"
import colors from "colors.cjs"
import useSignedIn from "~/utils/useSignedIn"
import GradientText from "~/components/GradientText"
import TopBar from "./TopBar"
import FancyButton from "~/components/FancyButton"

export const runtime = "edge"

export default function IndexPage() {
	const { signedIn } = useSignedIn()

	return (
		<>
			<TopBar />

			<main className="bg-white">
				<div className="flex h-screen">
					<div className="flex h-full flex-1 items-center justify-center">
						<div className="flex w-full flex-col pl-28 sm-mobile:px-6 lg-mobile:px-8">
							<GradientText asChild>
								<h1 className="select-text whitespace-pre text-[5rem] font-extrabold leading-[1.1] tracking-tight sm-mobile:mt-12 mobile:whitespace-normal mobile:text-[2.95rem]">
									Meet your students{"\n"}where they are
								</h1>
							</GradientText>
							{/* 
meet your students where they are

// 

// enables teachers to provide unprecedented levels of differentiation in less time

// empower students and teachers to address issues in understanding as they arise


feedback on their work that they can respond to and aggregates this feedback

interactive AI feedback and nuanced insights

Empowering students to resolve issues in their own work and teachers to pinpoint where their students struggle, unprecendented levels of differentiation are made possible.


vision features


empower both teachers and students to find out what students are struggling with and excelling in, as early and as frequently as they want

nothing else can provide the level of nuance in its insights that Understand can. relates to assignment instruction, goals and standards

don't wait until grading an important paper or test for you and your students to find  turn every assignment into a formative assessment

mission / vision: AI to augment -- never replace. It's the right approach to AI in schools.


how it works

features -- StudentGPT / TeacherGPT / tailored feedback responses / revision feature / insights / G-Suite/Classroom integration / teacher set standards and goals

- Provides students with a much tighter feedback loop. This is important because if students find out about the problems they’re making at a faster rate, they should learn at a faster rate.
- Now you can know what every single student in the class’s strengths and weaknesses are, all without assigning special formative assessments or analyzing data. Understand turns every assignments into a formative assessment.
- You don’t have to wait until grading for both you and your students to know how they’re doing. You and your students can start addressing the issues in their work much sooner. Enables an unprecedented rate of iteration in education.
- Teachers can use assignment insights to group students by weakness, and address them collectively. This is much faster than addressing students’ weaknesses individually, so now addressing every students’ individual weaknesses is feasible

spend more time on meaningful topics


tight feedback loopaddressing the lack
									of immediate feedback in conventional
									education. If students are made aware of
									what mistakes they&aposre making as they
									make them, they&apos;re going to learn at a
									faster rate.


Both teachers and students are empowered to
								address issues in students&apos; understanding
								as soon as they arise, enabling teachers to
								provide unprecedented levels of differention in
								less time. It&apos;s the right approach to AI in
								schools.


*/}
							<p className="mr-36 mb-8 mt-4 select-text text-xl font-medium text-black/70 mobile:mr-0 mobile:text-lg">
								Understand provides students with instant,
								in-depth feedback on their work that they can
								respond to, and aggregates this feedback into
								nuanced and actionable insights for teachers.
							</p>

							<div className="flex items-center gap-9 mobile:flex-col mobile:gap-5">
								{!signedIn ? (
									<a
										href={env.NEXT_PUBLIC_BOOK_MEETING_URL}
										target="_blank"
										rel="noreferrer"
										className="mobile:w-full"
									>
										<FancyButton
											size="medium"
											className="h-16 mobile:w-full"
										>
											Book a meeting
										</FancyButton>
									</a>
								) : (
									<Link
										href="/home"
										passHref
										className="mobile:w-full"
									>
										<FancyButton
											size="medium"
											className="h-16 mobile:w-full"
										>
											Dashboard
										</FancyButton>
									</Link>
								)}

								{!signedIn ? (
									<Link href="/signIn" passHref>
										<GradientText className="cursor-pointer select-none text-2xl font-bold transition-opacity duration-150 hover:opacity-75 mobile:mb-6">
											Sign in
										</GradientText>
									</Link>
								) : (
									<GradientText asChild>
										<a
											href={
												env.NEXT_PUBLIC_BOOK_MEETING_URL
											}
											target="_blank"
											rel="noreferrer"
											className="cursor-pointer select-none text-2xl font-bold transition-opacity duration-150 hover:opacity-75 mobile:mb-6"
										>
											Book a meeting
										</a>
									</GradientText>
								)}
							</div>
						</div>
					</div>

					<div className="flex h-full flex-[0.5] items-center justify-center px-16 mobile:hidden">
						<div className="relative h-80 w-full">
							<img
								src="/StudentFeedback.png"
								alt="Screenshot of student feedback"
								className="absolute -bottom-24 -right-8 z-10 w-[432px] rounded-xl border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] transition-all duration-300 hover:shadow-xl"
							/>

							<img
								src="/TeacherInsights.png"
								alt="Screenshot of student feedback"
								className="absolute -top-32 -left-8 w-96 rounded-xl border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] transition-all duration-300 hover:z-20 hover:shadow-xl"
							/>
						</div>
					</div>
				</div>

				<div className="flex mobile:flex-col mobile:space-y-8">
					<div className="flex w-full flex-1 flex-col py-16 pl-28 sm-mobile:px-6 lg-mobile:px-8 mobile:py-0">
						<GradientText className="mb-2 select-text text-2xl font-extrabold">
							How it works
						</GradientText>

						<div className="flex h-full flex-col space-y-16 mobile:space-y-4">
							<div>
								<h2 className="select-text text-4xl font-extrabold leading-none tracking-tight text-black/80">
									Teachers create assignments for their
									classes
								</h2>

								<p className="mt-4 ml-0.5 select-text text-base font-medium text-black/70">
									Teachers add assignments to Understand
									either manually or automatically via a sync
									with a Google Classroom class. This enables
									Understand to account for instructions on
									assignments in the feedback it provides, as
									well as other Understand features like
									StudentGPT and insights.
								</p>
							</div>

							<div>
								<h2 className="select-text text-4xl font-extrabold leading-none tracking-tight text-black/80">
									Students receive feedback on their work
								</h2>

								<p className="mt-4 ml-0.5 select-text text-base font-medium text-black/70">
									Understand provides students with in-depth,
									interactive AI feedback on their work
									whenever they want it, accounting for the
									assignment&apos;s instructions along with
									any goals or state standards the teacher
									chooses. The student can respond to this
									feedback with any question or comments they
									may have, or if they want Understand to
									provide them feedback on a revision
									they&apos;ve made. All responses are
									tailored to the individual student&apos;s
									writing style and proficiency.
								</p>
							</div>

							<div>
								<h2 className="select-text text-4xl font-extrabold leading-none tracking-tight text-black/80">
									Feedback is aggregated into insights for
									teachers
								</h2>

								<p className="mt-4 ml-0.5 select-text text-base font-medium text-black/70">
									The feedback students receive is aggregated
									into nuanced and actionable insights for
									teachers to differentiate their instruction
									accordingly. Assignment insights show the
									strengths and weaknesses of a class on a
									particular assignment and which students
									have them, and student insights show the
									strengths and weaknesses of a particular
									student and which assignments they&apos;re
									present in. All insights are paired with
									examples of them in students&apos; work.
									Insights also reference any goals or state
									standards chosen by the teacher.
								</p>
							</div>
						</div>
					</div>

					<div className="flex h-full flex-[0.5] flex-col space-y-6 pt-10 mobile:pt-0">
						<div className="">
							<img
								src="/ImportClass.png"
								alt="Screenshot of importing a class in Understand"
								className="mx-auto w-72 rounded-lg border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] mobile:w-2/3"
							/>
						</div>

						<div className="">
							<img
								src="/SmallStudentFeedback.png"
								alt="Screenshot of replying to student feedback"
								className="mx-auto w-[360px] rounded-lg border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] mobile:w-5/6"
							/>
						</div>

						<div className="">
							<img
								src="/TeacherInsights.png"
								alt="Screenshot of teacher insights"
								className="mx-auto w-[400px] rounded-lg border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] mobile:w-11/12"
							/>
						</div>
					</div>
				</div>

				<div className="flex h-screen w-full flex-col justify-center px-28 sm-mobile:px-6 lg-mobile:px-8">
					<h1 className="select-text text-[3.5rem] font-extrabold leading-tight tracking-tight text-black/80 sm-mobile:text-[2rem] lg-mobile:text-[2.25rem]">
						Empowering students to{" "}
						<GradientText asChild>
							<span className="select-text">
								resolve issues in their own work
							</span>
						</GradientText>{" "}
						and teachers to pinpoint their students&apos; strengths
						and weaknesses{" "}
						<GradientText asChild>
							<span className="select-text">as they arise</span>
						</GradientText>
						, unprecedented levels of{" "}
						<GradientText asChild>
							<span className="select-text">differentiation</span>
						</GradientText>{" "}
						are made possible with{" "}
						<GradientText asChild>
							<span className="select-text">Understand</span>
						</GradientText>
						.
					</h1>

					<a
						href={env.NEXT_PUBLIC_BOOK_MEETING_URL}
						target="_blank"
						rel="noreferrer"
						className="mx-auto h-fit w-fit"
					>
						<FancyButton
							size="large"
							className="mt-12 w-96 sm-mobile:mt-6 lg-mobile:mt-8 mobile:w-full"
						>
							Book a meeting
						</FancyButton>
					</a>
				</div>
			</main>

			<footer
				style={{
					background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary} 100%) border-box`,
				}}
				className="flex justify-between p-8 backdrop-blur-xl"
			>
				<button
					onClick={() =>
						window.scrollTo({ top: 0, behavior: "smooth" })
					}
					className="text-3xl font-extrabold tracking-tight text-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
				>
					Understand
				</button>

				<div className="flex items-center gap-4">
					<a
						href="https://linkedin.com/in/understandschool"
						target="_blank"
						rel="noreferrer"
					>
						<svg
							fill="#000000"
							version="1.1"
							id="Layer_1"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="-143 145 512 512"
							className="h-6 w-6 fill-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
						>
							<path
								d="M329,145h-432c-22.1,0-40,17.9-40,40v432c0,22.1,17.9,40,40,40h432c22.1,0,40-17.9,40-40V185C369,162.9,351.1,145,329,145z
	 M41.4,508.1H-8.5V348.4h49.9V508.1z M15.1,328.4h-0.4c-18.1,0-29.8-12.2-29.8-27.7c0-15.8,12.1-27.7,30.5-27.7
	c18.4,0,29.7,11.9,30.1,27.7C45.6,316.1,33.9,328.4,15.1,328.4z M241,508.1h-56.6v-82.6c0-21.6-8.8-36.4-28.3-36.4
	c-14.9,0-23.2,10-27,19.6c-1.4,3.4-1.2,8.2-1.2,13.1v86.3H71.8c0,0,0.7-146.4,0-159.7h56.1v25.1c3.3-11,21.2-26.6,49.8-26.6
	c35.5,0,63.3,23,63.3,72.4V508.1z"
							/>
						</svg>
					</a>

					<a
						href="mailto:support@understand.school"
						target="_blank"
						rel="noreferrer"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
							className="h-6 w-6 fill-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
						>
							<path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
						</svg>
					</a>
				</div>
			</footer>
		</>
	)
}
