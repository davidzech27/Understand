import env from "env.mjs"
import GradientText from "~/components/GradientText"
import GetStartedButton from "./GetStartedButton"
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
							<h1 className="select-none py-2 text-[2.75em] font-extrabold leading-[1.1] tracking-tight lg:whitespace-pre lg:text-[3.5rem] xl:text-[4.5rem] 2xl:text-[5.5rem]">
								Meet your students{"\n"}where they are
							</h1>
						</GradientText>

						<p className="mb-8 mt-2.5 w-full select-text text-lg font-medium opacity-60 lg:w-3/4 lg:text-xl">
							Understand is an AI-powered educational platform
							that gives you the tools and insights you need to
							personalize your class to the needs of your
							students. Your students will see the difference.
						</p>

						<div className="flex flex-col space-x-0 space-y-4 text-center sm:flex-row sm:items-center sm:space-y-0 sm:space-x-9">
							<div className="h-16">
								<GetStartedButton />
							</div>

							<GradientText asChild>
								<a
									href={env.NEXT_PUBLIC_LEARN_MORE_URL}
									target="_blank"
									className="cursor-pointer select-none text-2xl font-semibold transition-opacity duration-150 hover:opacity-75"
								>
									Learn more
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
