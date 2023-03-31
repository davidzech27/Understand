import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import FancyButton from "~/components/shared/FancyButton";
import colors from "colors.cjs";

const Index: NextPage = () => {
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

			<main className="flex min-h-screen w-full justify-center">
				<div className="flex h-screen w-full items-center justify-center">
					<div className="flex h-screen flex-[2] flex-col items-center justify-center">
						<div className="w-min flex-col space-y-8">
							<h1
								style={{
									background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
									WebkitBackgroundClip: "text",
									backgroundClip: "text",
									color: "transparent",
								}}
								className="-mb-[22px] select-none whitespace-pre py-2 text-5xl font-extrabold tracking-tight sm:text-8xl"
							>
								Supercharge{"\n"}student learning
							</h1>

							<p className="ml-1 text-xl font-medium opacity-60">
								With our next-generation student learning
								platform, provide your students with tailored
								learning experiences and your teachers with
								in-depth insights.
							</p>

							<div className="ml-1 flex">
								<div className="h-16 w-48">
									<FancyButton href="/signIn">
										Get started
									</FancyButton>
								</div>

								<div className="ml-9 flex items-center">
									<span
										style={{
											background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
											WebkitBackgroundClip: "text",
											backgroundClip: "text",
											color: "transparent",
										}}
										className="cursor-pointer select-none text-2xl font-semibold transition-opacity duration-150 hover:opacity-75"
									>
										Learn more
									</span>
								</div>
							</div>
						</div>
					</div>
					<div className="flex h-screen flex-1 justify-start">
						<div className="flex h-screen w-2/3 flex-col gap-1">
							{Array(6)
								.fill(0)
								.map((_, index) => (
									<div
										key={index}
										className="w-full flex-1 rounded-lg border-x border-y"
									></div>
								))}
						</div>
					</div>
				</div>
			</main>
		</>
	);
};

export default Index;
