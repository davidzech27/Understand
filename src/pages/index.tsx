import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import colors from "colors.cjs";
import { api } from "~/lib/api";

const Index: NextPage = () => {
	const onSignIn = () => {
		signIn("google", { callbackUrl: "/home" });
	};

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
								<button
									onClick={onSignIn}
									className="group relative flex h-16 w-48 items-center justify-center"
								>
									<span className="select-none text-2xl font-medium text-black opacity-80 transition-all duration-150 group-hover:text-white group-hover:opacity-100">
										Sign in
									</span>

									<div className="absolute -z-10 h-full w-full rounded-xl bg-gradient-to-tr from-primary to-secondary opacity-0 transition-opacity duration-150 group-hover:opacity-100" />

									<div
										style={{
											border: "4px solid transparent",
											background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary}) border-box`,
											WebkitMask:
												"linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
											WebkitMaskComposite: "xor",
											maskComposite: "exclude",
										}}
										className="absolute h-full w-full rounded-xl"
									/>
								</button>

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
								.map(() => (
									<div className="w-full flex-1 rounded-lg border-x border-y"></div>
								))}
						</div>
					</div>
				</div>
			</main>
		</>
	);
};

export default Index;
