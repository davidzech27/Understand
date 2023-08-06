import env from "env.mjs"
import GradientText from "~/components/GradientText"
import SignInButton from "./SignInButton"
import ReviewScroller from "./ReviewScroller"

export const metadata = {
	title: "Understand",
	description:
		"The personalized educational content and student insight platform",
}

export default async function IndexPage() {
	return (
		<>
			<main className="absolute top-0 bottom-0 left-0 right-0 flex flex-col overflow-y-scroll bg-white">
				<div className="flex h-screen w-full items-center justify-center">
					<div className="flex h-screen flex-[2.5] flex-col justify-center px-[16%]">
						<GradientText asChild>
							<h1 className="select-text py-2 text-[2.75em] font-extrabold leading-[1.1] tracking-tight lg:whitespace-pre lg:text-[3.5rem] xl:text-[4.5rem] 2xl:text-[5.5rem]">
								Meet your students{"\n"}where they are
							</h1>
						</GradientText>

						<p className="mb-8 mt-2.5 w-full select-text text-lg font-medium text-black/70 lg:w-3/4 lg:text-xl">
							Understand provides students with instant, in-depth
							feedback on their work that they can respond to and aggregates this feedback into nuanced and actionable insights for teachers. It&apos;s the right approach to AI in schools.
						</p>

						<div className="flex flex-col space-x-0 space-y-5 text-center sm:flex-row sm:items-center sm:space-y-0 sm:space-x-9">
							<div className="h-16">
								<SignInButton />
							</div>

							<GradientText asChild>
								<a
									href={env.NEXT_PUBLIC_BOOK_MEETING_URL}
									target="_blank"
									rel="noreferrer"
									className="cursor-pointer select-none text-2xl font-bold transition-opacity duration-150 hover:opacity-75 active:opacity-75 focus-visible:opacity-75"
								>
									Book a meeting
								</a>
							</GradientText>
						</div>
					</div>

					<div className="hidden h-screen flex-1 lg:flex">
						<ReviewScroller />
					</div>
				</div>
			</main>
		</>
	)
}
