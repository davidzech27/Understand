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

		if (selectedRole) {
			await authenticateWithGoogle({
				permissions:
					selectedRole === "student"
						? [
								"courses",
								"rosters",
								"selfAssignments",
								"assignmentAttachments", // perhaps later check if user has this permission on backend instead of requesting it on first signIn
						  ]
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

			setTimeout(() => setLoading(false), 1000);
		}
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

						<ListBox
							selectionMode="single"
							disallowEmptySelection
							onSelectionChange={(selectedIds) => {
								for (const selectedId of selectedIds) {
									setSelectedRole(
										selectedId as
											| "student"
											| "teacher"
											| "both"
									);
								}
							}}
							className="mt-6 mb-6 flex w-full flex-col space-y-4 px-16"
						>
							<Item id="student" className="group">
								{({ isSelected }) => (
									<div
										className={clsx(
											"flex h-20 w-full items-center justify-center rounded-md py-2.5 px-6 text-2xl font-medium transition-all duration-150",
											isSelected
												? "cursor-default bg-surface-selected-hover opacity-80"
												: "cursor-pointer bg-surface-hover opacity-60 group-data-[hovered]:bg-surface-selected"
										)}
									>
										Student
									</div>
								)}
							</Item>

							<Item id="teacher" className="group">
								{({ isSelected }) => (
									<div
										className={clsx(
											"flex h-20 w-full items-center justify-center rounded-md py-2.5 px-6 text-2xl font-medium transition-all duration-150",
											isSelected
												? "cursor-default bg-surface-selected-hover opacity-80"
												: "cursor-pointer bg-surface-hover opacity-60 group-data-[hovered]:bg-surface-selected"
										)}
									>
										Teacher
									</div>
								)}
							</Item>

							<Item id="both" className="group">
								{({ isSelected }) => (
									<div
										className={clsx(
											"flex h-20 w-full items-center justify-center rounded-md py-2.5 px-6 text-2xl font-medium transition-all duration-150",
											isSelected
												? "cursor-default bg-surface-selected-hover opacity-80"
												: "cursor-pointer bg-surface-hover opacity-60 group-data-[hovered]:bg-surface-selected"
										)}
									>
										Both
									</div>
								)}
							</Item>
						</ListBox>

						<div className="relative h-20 w-96">
							<Link isDisabled={selectedRole === undefined}>
								<FancyButton
									onPress={onSignIn}
									disabled={selectedRole === undefined}
									loading={loading}
									bigText
								>
									Sign in with Google
								</FancyButton>
							</Link>

							<span className="absolute left-0 right-0 mt-5 select-text rounded-md border border-border bg-surface py-4 px-5 text-center font-medium opacity-80 shadow-lg shadow-[#0000000A]">
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
