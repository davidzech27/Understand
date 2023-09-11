import env from "env.mjs"
import GradientText from "~/components/GradientText"
import FancyButton from "~/components/FancyButton"
import CTAButtons from "./CTAButtons"

export const runtime = "edge"

export default function IndexPage() {
	return (
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
						<p className="mb-8 mr-36 mt-4 select-text text-xl font-medium text-black/70 mobile:mr-0 mobile:text-lg">
							Understand provides students with instant, in-depth
							feedback on their writing that they can respond to,
							and aggregates this feedback into nuanced and
							actionable insights for teachers.
						</p>

						<div className="flex items-center gap-9 mobile:flex-col mobile:gap-5">
							<CTAButtons />
						</div>
					</div>
				</div>

				<div className="flex h-full flex-[0.5] items-center justify-center px-16 mobile:hidden">
					<div className="relative h-80 w-full">
						<img
							src="/StudentFeedback.png"
							alt="Screenshot of student feedback"
							className="absolute -bottom-24 -right-8 z-10 w-[432px] origin-bottom-right rounded-xl border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] transition-all duration-[400ms] ease-out hover:scale-125 hover:shadow-xl active:scale-125"
						/>

						<img
							src="/TeacherInsights.png"
							alt="Screenshot of student feedback"
							className="absolute -left-8 -top-32 w-96 origin-top-left rounded-xl border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] transition-all duration-[400ms] ease-out hover:z-20 hover:scale-125 hover:shadow-xl active:scale-125"
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
								Teachers create assignments for their classes
							</h2>

							<p className="ml-0.5 mt-4 select-text text-lg font-medium text-black/70 mobile:text-base">
								Teachers add assignments to Understand either
								manually or automatically via a sync with a
								Google Classroom class. Understand will use
								assignments&apos; instructions, along with any
								goals or state standards the teacher chooses, to
								customize the feedback provided to students and
								the insights derived from this feedback.
							</p>
						</div>

						<div>
							<h2 className="select-text text-4xl font-extrabold leading-none tracking-tight text-black/80">
								Students receive feedback on their work
							</h2>

							<p className="ml-0.5 mt-4 select-text text-lg font-medium text-black/70 mobile:text-base">
								Understand provides students with in-depth,
								interactive AI feedback on their work whenever
								they want it. Students can respond to feedback
								provided if they have any questions or comments,
								or if they want Understand to provide them
								feedback on a revision they&apos;ve made. All
								responses are tailored to the individual
								student&apos;s writing style and proficiency.
							</p>
						</div>

						<div>
							<h2 className="select-text text-4xl font-extrabold leading-none tracking-tight text-black/80">
								Feedback is aggregated into insights for
								teachers
							</h2>

							<p className="ml-0.5 mt-4 select-text text-lg font-medium text-black/70 mobile:text-base">
								The feedback students receive is aggregated into
								nuanced and actionable insights for teachers.
								Assignment insights display the strengths and
								weaknesses of a class on a particular assignment
								and which students have them, and student
								insights display the strengths and weaknesses of
								a particular student and which assignments
								they&apos;re present in. All insights are paired
								with examples of them in students&apos; work.
							</p>
						</div>
					</div>
				</div>

				<div className="flex h-full flex-[0.5] flex-col space-y-6 pt-14 mobile:pt-0">
					<div className="">
						<img
							src="/ImportClass.png"
							alt="Screenshot of importing a class in Understand"
							className="mx-auto w-72 origin-top-right rounded-lg border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] duration-[400ms] ease-out hover:scale-110 active:scale-110 mobile:w-2/3 mobile:origin-top"
						/>
					</div>

					<div className="">
						<img
							src="/SmallStudentFeedback.png"
							alt="Screenshot of replying to student feedback"
							className="mx-auto w-[360px] origin-right rounded-lg border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] duration-[400ms] ease-out hover:scale-105 active:scale-105 mobile:w-5/6 mobile:origin-center"
						/>
					</div>

					<div className="">
						<img
							src="/TeacherInsights.png"
							alt="Screenshot of teacher insights"
							className="mx-auto w-[400px] origin-bottom-right rounded-lg border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] duration-[400ms] ease-out hover:scale-105 active:scale-105 mobile:w-11/12 mobile:origin-bottom"
						/>
					</div>
				</div>
			</div>

			<div className="flex h-screen w-full flex-col justify-center px-28 sm-mobile:px-6 lg-mobile:px-8 mobile:h-auto mobile:py-12">
				<h1 className="select-text text-[3.5rem] font-extrabold leading-tight tracking-tight text-black/80 sm-mobile:text-[2rem] lg-mobile:text-[2.25rem]">
					Empowering students to{" "}
					<GradientText asChild>
						<span className="select-text">
							resolve issues in their own work
						</span>
					</GradientText>{" "}
					and teachers to pinpoint their students&apos; strengths and
					weaknesses{" "}
					<GradientText asChild>
						<span className="select-text">as they arise</span>
					</GradientText>
					, unprecedented levels of differentiation are made possible
					with{" "}
					<GradientText asChild>
						<span className="select-text">Understand</span>
					</GradientText>
					.
				</h1>

				<a
					href={env.NEXT_PUBLIC_BOOK_MEETING_URL}
					target="_blank"
					rel="noreferrer"
					className="mx-auto h-fit w-fit mobile:w-full"
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
	)
}
