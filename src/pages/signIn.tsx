import { type NextPage } from "next";
import Head from "next/head";
import authenticateWithGoogle from "~/lib/authenticateWithGoogle";
import WideButton from "~/components/shared/WideButton";
import { useState } from "react";
import FancyButton from "~/components/shared/FancyButton";

// todo - add extra content to fill awkward whitespace. or perhaps make panel smaller, but this would make the gradient section too big

const SignIn: NextPage = () => {
	const onSignIn = () => {
		selectedRole &&
			authenticateWithGoogle({
				permissions:
					selectedRole === "student"
						? ["courses", "rosters", "selfAssignments"]
						: selectedRole === "teacher"
						? [
								"courses",
								"rosters",
								"studentAssignments",
								"assignmentAttachments",
						  ]
						: [
								"courses",
								"rosters",
								"studentAssignments",
								"selfAssignments",
								"assignmentAttachments",
						  ],
				redirectTo: "/landing",
			});
	};

	const [selectedRole, setSelectedRole] = useState<
		"student" | "teacher" | "both"
	>();

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

			<main className="flex h-screen w-full justify-center bg-gradient-to-tr from-primary to-secondary">
				<div className="flex flex-[0.625] flex-col justify-center py-5 px-6">
					<div className="flex-[0.875]" />

					<div className="w-full text-center text-7xl font-bold leading-[1.05] tracking-tight text-white">
						Welcome to Understand!
						<br />
						Let&apos;s get started.
					</div>

					<div className="flex-1" />
				</div>

				<div className="flex-1 py-5 pr-6">
					<div className="flex h-full w-full flex-col items-center rounded-lg bg-white py-12 px-12 shadow-xl">
						<div className="flex-[0.875]" />

						<div className="text-3xl font-medium leading-none opacity-60">
							Which role describes you the best?
						</div>

						<div className="mt-6 mb-6 flex w-full flex-col space-y-4 px-16">
							<div className="h-20">
								<WideButton
									onClick={() => setSelectedRole("student")}
									disabled={selectedRole === "student"}
								>
									Student
								</WideButton>
							</div>

							<div className="h-20">
								<WideButton
									onClick={() => setSelectedRole("teacher")}
									disabled={selectedRole === "teacher"}
								>
									Teacher
								</WideButton>
							</div>

							<div className="h-20">
								<WideButton
									onClick={() => setSelectedRole("both")}
									disabled={selectedRole === "both"}
								>
									Both
								</WideButton>
							</div>
						</div>

						<div className="relative h-20 w-96">
							<FancyButton
								onClick={onSignIn}
								disabled={selectedRole === undefined}
								bigText
							>
								Sign in with Google
							</FancyButton>

							<span className="absolute left-0 right-0 mt-4 text-center text-sm font-medium opacity-60">
								Make sure that you check all the checkboxes
								<br />
								for Google account access or Understand
								<br />
								won&apos;t be able to work properly
							</span>
						</div>

						<div className="flex-1" />
					</div>
				</div>
			</main>
		</>
	);
};

export default SignIn;
