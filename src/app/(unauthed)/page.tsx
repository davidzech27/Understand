import Link from "next/link"

import GradientText from "~/components/GradientText"
import FancyButton from "~/components/FancyButton"
import CTAButtons from "./CTAButtons"

export const runtime = "edge"

export default function IndexPage() {
	return (
		<main className="bg-white">
			<div className="flex px-24 sm-mobile:px-6 lg-mobile:px-8 mobile:flex-col">
				<div className="flex h-screen w-1/2 flex-col justify-center mobile:w-full">
					<GradientText asChild>
						<h1 className="select-text text-[3.5rem] font-extrabold leading-[1.1] tracking-tight sm-mobile:mt-12 mobile:whitespace-normal mobile:text-[3rem]">
							Differentiate more effectively in less time
						</h1>
					</GradientText>

					<p className="mb-8 mt-4 select-text text-xl font-medium text-black/70 mobile:text-lg">
						Understand provides students with in-depth,
						pedagogically sound AI feedback feedback on written
						assignments, and shows you your students&apos; strengths
						and weaknesses and where they appear. Free for teachers,
						always.
					</p>

					<div className="flex items-center gap-9 mobile:flex-col mobile:gap-5">
						<CTAButtons />
					</div>
				</div>

				<div className="flex h-screen w-1/2 items-center justify-center px-16 mobile:w-full">
					<div className="relative h-80 w-full">
						<img
							src="/StudentFeedback.png"
							alt="Screenshot of student feedback"
							className="absolute -bottom-24 -right-8 z-10 w-[432px] origin-bottom-right rounded-xl border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] transition-all duration-[400ms] ease-out hover:scale-125 hover:shadow-xl active:scale-125"
						/>

						<img
							src="/TeacherInsights.png"
							alt="Screenshot of student feedback"
							className="absolute -left-8 -top-12 w-[432px] origin-top-left rounded-xl border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] transition-all duration-[400ms] ease-out hover:z-20 hover:scale-125 hover:shadow-xl active:scale-125"
						/>
					</div>
				</div>
			</div>

			<div className="flex space-x-24 px-24 sm-mobile:px-6 lg-mobile:px-8 mobile:flex-col">
				<div className="flex h-screen w-2/3 flex-col justify-center mobile:w-full">
					<GradientText className="mb-2 select-text text-2xl font-extrabold">
						How it works
					</GradientText>

					<div className="space-y-6">
						<h2 className="select-text text-4xl font-extrabold leading-none tracking-tight text-black/80">
							Add assignments
						</h2>

						<p className="select-text text-xl font-medium text-black/70 mobile:text-base">
							Customization offers fine-grained control over AI
							feedback and insights.
						</p>

						<h2 className="select-text text-4xl font-extrabold leading-none tracking-tight text-black/80">
							Students get feedback
						</h2>

						<p className="select-text text-xl font-medium text-black/70 mobile:text-base">
							Students get AI feedback on their work and any
							revisions they make. Students can ask follow-up
							questions and get contextually-aware responses.
						</p>

						<h2 className="select-text text-4xl font-extrabold leading-none tracking-tight text-black/80">
							See insights
						</h2>

						<p className="select-text text-xl font-medium text-black/70 mobile:text-base">
							See your students&apos; strengths and weaknesses as
							they arise, along with which students have them and
							where they appear in their work. See insights either
							grouped by assignment or by student.
						</p>
					</div>
				</div>

				<div className="flex h-screen w-1/3 flex-col items-center justify-center space-y-6 mobile:w-full">
					<img
						src="/SmallStudentFeedback.png"
						alt="Screenshot of replying to student feedback"
						className="w-full origin-top-right rounded-lg border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] duration-[400ms] ease-out hover:scale-110 active:scale-110 mobile:origin-top"
					/>

					<img
						src="/TeacherInsights.png"
						alt="Screenshot of teacher insights"
						className="w-full origin-bottom-right rounded-lg border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] duration-[400ms] ease-out hover:scale-110 active:scale-110 mobile:origin-bottom"
					/>
				</div>
			</div>

			<div className="flex h-screen flex-col justify-center px-24 sm-mobile:px-6 lg-mobile:px-8">
				<h1 className="select-text text-[2.5rem] font-extrabold leading-tight tracking-tight text-black/80 sm-mobile:text-[2rem] lg-mobile:text-[2.25rem]">
					Empowering you to pinpoint your students&apos; strengths and
					weaknesses as they arise and students to resolve issues in
					their own work,{" "}
					<GradientText asChild>
						<span className="select-text">
							you&apos;ll meet your students where they are in
							less time with Understand.
						</span>
					</GradientText>
				</h1>

				<Link
					href="/signIn"
					className="mx-auto h-fit w-fit mobile:w-full"
				>
					<FancyButton
						size="large"
						className="mt-12 px-12 sm-mobile:mt-6 lg-mobile:mt-8 mobile:w-full"
					>
						Add your first assignment
					</FancyButton>
				</Link>
			</div>
		</main>
	)
}

// don't wait until grading an important paper or test for you and your students to find  turn every assignment into a formative assessment

// mission / vision: AI to augment -- never replace. It's the right approach to AI in schools.

// how it works

// features -- StudentGPT / TeacherGPT / tailored feedback responses / revision feature / insights / G-Suite/Classroom integration / teacher set standards and goals

// - Provides students with a much tighter feedback loop. This is important because if students find out about the problems they’re making at a faster rate, they should learn at a faster rate.
// - Now you can know what every single student in the class’s strengths and weaknesses are, all without assigning special formative assessments or analyzing data. Understand turns every assignments into a formative assessment.
// - You don’t have to wait until grading for both you and your students to know how they’re doing. You and your students can start addressing the issues in their work much sooner. Enables an unprecedented rate of iteration in education.
// - Teachers can use assignment insights to group students by weakness, and address them collectively. This is much faster than addressing students’ weaknesses individually, so now addressing every students’ individual weaknesses is feasible

// spend more time on meaningful topics

// tight feedback loopaddressing the lack
// 									of immediate feedback in conventional
// 									education. If students are made aware of
// 									what mistakes they&aposre making as they
// 									make them, they&apos;re going to learn at a
// 									faster rate.

// Both teachers and students are empowered to
// 								address issues in students&apos; understanding
// 								as soon as they arise, enabling teachers to
// 								provide unprecedented levels of differention in
// 								less time. It&apos;s the right approach to AI in
// 								schools.
