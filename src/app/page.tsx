import ReviewScroller from "./ReviewScroller"
import GetStartedButton from "./GetStartedButton"
import colors from "~/colors.cjs"
import { env } from "~/env.mjs"

export const metadata = {
	title: "Understand",
	description:
		"The personalized educational content and student insight platform",
}

const IndexPage = async () => {
	return (
		<>
			<main className="flex w-screen flex-col bg-white">
				<div className="flex h-screen w-full items-center justify-center">
					<div className="flex h-screen flex-[2.5] flex-col justify-center px-[16%]">
						<h1
							style={{
								background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
								WebkitBackgroundClip: "text",
								backgroundClip: "text",
								color: "transparent",
							}}
							className="select-none py-2 text-[4rem] font-extrabold leading-[1.1] tracking-tight md:text-[5.5rem] lg:whitespace-pre"
						>
							The future of education{"\n"}is personalized
						</h1>

						<p className="mb-8 mt-2.5 w-full select-text text-xl font-medium opacity-60 lg:w-3/4">
							Understand is an AI-powered educational platform
							that gives you the tools and insights you need to
							personalize your class to the needs of your
							students. Your students will see the difference.
						</p>

						<div className="flex flex-col space-x-0 space-y-4 text-center sm:flex-row sm:items-center sm:space-y-0 sm:space-x-9">
							<div className="h-16">
								<GetStartedButton />
							</div>

							<a
								href={env.NEXT_PUBLIC_LEARN_MORE_URL}
								target="_blank"
								style={{
									background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
									WebkitBackgroundClip: "text",
									backgroundClip: "text",
									color: "transparent",
								}}
								className="cursor-pointer select-none text-2xl font-semibold transition-opacity duration-150 hover:opacity-75"
							>
								Learn more
							</a>
						</div>
					</div>

					<div className="hidden h-screen flex-1 md:flex">
						<ReviewScroller />
					</div>
				</div>
			</main>
		</>
	)
}

export default IndexPage
