import { type NextPage } from "next";
import { useState } from "react";
import { Link } from "react-aria-components";
import {
	Item,
	GridList,
	Menu,
	ListBox,
	ToggleButton,
} from "react-aria-components";
import clsx from "clsx";
import Head from "next/head";
import authenticateWithGoogle from "~/client/modules/auth/authenticateWithGoogle";
import FancyButton from "~/client/modules/shared/FancyButton";

// todo - add extra content to fill awkward whitespace. or perhaps make panel smaller, but this would make the gradient section too big

const SignIn: NextPage = () => {
	const [loading, setLoading] = useState(false);

	const onSignIn = async () => {
		setLoading(true);

		await authenticateWithGoogle({
			permissions: [
				"courses",
				"rosters",
				"studentAssignments",
				"selfAssignments",
				"assignmentAttachments",
			],
			redirectTo: "/landing",
		});

		setTimeout(() => setLoading(false), 1000);
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
						<div className="flex-[0.65]" />

						<div className="relative mx-8 h-24 w-full">
							<Link>
								<FancyButton
									onPress={onSignIn}
									loading={loading}
									bigText
								>
									Sign in with your school Google account
								</FancyButton>
							</Link>

							<span className="absolute left-0 right-0 mt-8 select-text rounded-md border border-border bg-surface py-4 px-5 text-center text-lg font-medium opacity-80 shadow-lg shadow-[#00000010]">
								Make sure that you check all the boxes for
								Google account access! Otherwise, Understand
								won&apos;t be able to work properly. We promise
								we won&apos;t steal your data!
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
