import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import FancyButton from "~/client/modules/shared/FancyButton";
import colors from "colors.cjs";
import { env } from "~/env.mjs";

const Index: NextPage = () => {
	const [scrollerHovered, setScrollerHovered] = useState(false); // in the future use this to slow down scrolling. https://stackoverflow.com/questions/70263043/change-animation-duration-without-reset-on-framer-motion

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

			<main className="flex flex-col bg-white">
				<div className="flex h-screen w-full items-center justify-center">
					<div className="flex h-screen flex-[2.5] flex-col items-center justify-center md:items-end">
						<div className="w-min flex-col space-y-8">
							<h1
								style={{
									background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
									WebkitBackgroundClip: "text",
									backgroundClip: "text",
									color: "transparent",
								}}
								className="-mb-[22px] select-none whitespace-pre py-2 text-[1.5rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2rem] md:text-[2.5rem] lg:text-[4rem] xl:text-[4.5rem] 2xl:text-[5.5rem]"
							>
								The future of education{"\n"}is personalized
							</h1>

							<p className="ml-1 select-text text-lg font-medium opacity-60 sm:text-base lg:text-xl">
								Provide your students with tailored learning
								experiences and your teachers with in-depth
								insights with our AI-powered education platform.
							</p>

							<div className="ml-1 flex flex-col space-y-7 md:flex-row md:items-center md:space-y-0 md:space-x-9">
								<div className="h-16 w-48">
									<Link
										href={
											typeof localStorage !==
												"undefined" &&
											localStorage.getItem(
												"hightlight-identified"
											) === "true"
												? "/home"
												: "/signIn"
										}
										legacyBehavior
									>
										<a>
											<FancyButton>
												Get started
											</FancyButton>
										</a>
									</Link>
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
									className="ml-1 cursor-pointer select-none text-2xl font-semibold transition-opacity duration-150 hover:opacity-75 md:ml-0"
								>
									Learn more
								</a>
							</div>
						</div>
					</div>
					<div className="relative hidden h-screen flex-1 justify-center overflow-hidden md:flex">
						<motion.div
							animate={{
								y: "100vh",
							}}
							transition={{
								duration: 15,
								ease: "linear",
								repeat: Infinity,
								repeatType: "loop",
							}}
							className="absolute bottom-0 flex h-[200vh] w-full flex-col gap-1 pl-10 pr-12"
						>
							{Array(5)
								.fill(0)
								.map((_, index) => (
									<div
										onMouseEnter={() =>
											setScrollerHovered(true)
										}
										onMouseLeave={() =>
											setScrollerHovered(false)
										}
										key={index}
										className="w-full flex-1 rounded-lg border-x border-y"
									></div>
								))}
							{Array(5)
								.fill(0)
								.map((_, index) => (
									<div
										onMouseEnter={() =>
											setScrollerHovered(true)
										}
										onMouseLeave={() =>
											setScrollerHovered(false)
										}
										key={index}
										className="w-full flex-1 rounded-lg border-x border-y"
									></div>
								))}
						</motion.div>
					</div>
				</div>
			</main>
		</>
	);
};

export default Index;
