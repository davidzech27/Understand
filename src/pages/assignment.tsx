import { TextareaHTMLAttributes, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import colors from "colors.cjs";
import { api } from "~/lib/trpc";
import DefaultLayout from "~/components/layout/DefaultLayout";
import clsx from "clsx";
import formatDate from "~/util/formatDate";
import Modal from "~/components/shared/Modal";
import undefinedTypeGuard from "~/util/undefinedTypeGuard";
import TextArea from "~/components/shared/TextArea";
import ToggleButton from "~/components/shared/ToggleButton";
import Button from "~/components/shared/Button";
import fetchOpenaiStream from "~/lib/fetchOpenaiStream";
import { getFeedbackPrompt, summarizeInstructionsPrompt } from "~/prompts";
import authenticateWithGoogle from "~/lib/authenticateWithGoogle";
import useStickyState from "~/util/useStickyState";
import useSelectedCourse from "~/util/useSelectedCourse";

// consider letting users delete feedback
// todo - make page protected
// todo - make loading screens
const Assignment: NextPage = () => {
	const router = useRouter();

	const assignmentId = router.asPath.split("/").at(-1) as string;

	const courseId = router.asPath.split("/").at(-3) as string;

	const { selectedCourse, role } = useSelectedCourse({
		selectedCourseId: courseId,
	});

	const [subpage, setSubpage] = useStickyState<"feedback" | "insights">(
		"feedback",
		`course:${courseId}:${assignmentId}:subpage`
	);

	const queryClient = api.useContext();

	const { data: assignment } = api.assignments.get.useQuery(
		{
			id: assignmentId,
			courseId,
		},
		{
			initialData: () =>
				queryClient.assignments.byCourse
					.getData({ courseId })
					?.find((assignment) => assignment.id === assignmentId),
		}
	);

	const [modal, setModal] = useState<React.ReactNode>();

	const driveFiles = assignment?.materials
		.map((material) =>
			material.type === "driveFile" ? material.driveFile : undefined
		)
		.filter(undefinedTypeGuard);

	const onPickAttachment = async ({ id }: { id: string }) => {
		try {
			const googleDocText =
				await queryClient.feedback.getGoogleDocText.fetch({
					id,
				});

			fetchOpenaiStream({
				...summarizeInstructionsPrompt({
					text: googleDocText,
				}),
				onContent: (content) => {
					setModal(undefined);

					setFeedbackInstructionsInput((prev) => prev + content);

					instructionsInputRef.current?.scroll({
						top: instructionsInputRef.current?.scrollHeight,
					});
				},
			});
		} catch {
			authenticateWithGoogle({
				permissions: ["drive"],
				redirectTo: window.location.href,
			});
		}
	};

	const configureFeedback =
		api.feedback.configureFeedback.useMutation().mutate;

	const [feedbackInstructionsInput, setFeedbackInstructionsInput] =
		useState("");

	const instructionsInputRef = useRef<HTMLTextAreaElement>(null);

	const [changingFeedbackInstructions, setChangingFeedbackInstructions] =
		useState(false); // changing is different than editing, as changing implies that it already exists

	const editingFeedbackInstructions =
		changingFeedbackInstructions || !assignment?.feedbackConfig;

	const onChange = () => {
		assignment.feedbackConfig && // will always be satisfied because feedbackConfig has to exist for onChange to be visible
			setFeedbackInstructionsInput(
				assignment.feedbackConfig?.instructions
			);

		setChangingFeedbackInstructions(true);

		process.nextTick(() => instructionsInputRef.current?.select());
	};

	const onDone = () => {
		configureFeedback({
			assignmentId,
			courseId,
			instructions: feedbackInstructionsInput,
		});

		setChangingFeedbackInstructions(false); // confusing system. only matters if instructions previously existed

		const assignmentNew = {
			...assignment,
			feedbackConfig: {
				instructions: feedbackInstructionsInput,
			},
		};

		queryClient.assignments.get.setData(
			{ courseId, id: assignmentId },
			assignmentNew
		);

		queryClient.assignments.byCourse.setData({ courseId }, (prev) => {
			const assignmentIndex = prev?.findIndex(
				(assignment) => assignment.id === assignmentId
			);

			prev && assignmentIndex && (prev[assignmentIndex] = assignmentNew);

			return prev;
		});
	};

	const onCancel = () => setChangingFeedbackInstructions(false);

	const [showLinkCopied, setShowLinkCopied] = useState(false);

	const [demoAssignmentInput, setDemoAssignmentInput] = useState("");

	const demoAssignmentInputRef = useRef<HTMLTextAreaElement>(null);

	const [demoFeedback, setDemoFeedback] = useState("");

	const demoFeedbackRef = useRef<HTMLDivElement>(null);

	const [generatingDemoFeedback, setGeneratingDemoFeedback] = useState(false);

	const { data: profile } = api.profile.me.useQuery();

	const onGetFeedback = () => {
		setGeneratingDemoFeedback(true);

		assignment.feedbackConfig &&
			profile &&
			selectedCourse &&
			fetchOpenaiStream({
				...getFeedbackPrompt({
					assignment: demoAssignmentInput,
					instructions: assignment.feedbackConfig.instructions,
					studentName: profile.name,
					courseName: selectedCourse.name,
				}),
				onContent: (content) => {
					setDemoFeedback((prev) => prev + content);

					demoFeedbackRef.current?.scroll({
						top: demoFeedbackRef.current?.scrollHeight,
					});
				},
				onFinish: () => setGeneratingDemoFeedback(false),
			});
	};

	const onTryAgain = () => {
		setDemoFeedback("");

		process.nextTick(() => demoAssignmentInputRef.current?.select());
	};

	const processedDemoFeedback = (() => {
		const indexOfFeedbackBeginning = demoFeedback.indexOf("Step 2");

		if (indexOfFeedbackBeginning === -1) return "";

		return demoFeedback
			.slice(indexOfFeedbackBeginning)
			.split("\n")
			.slice(1)
			.join("\n")
			.trim();
	})();

	return (
		<DefaultLayout forceLoading={!assignment} selectedCourseId={courseId}>
			{assignment && (
				<div className="flex min-h-screen flex-col space-y-2.5 py-2.5 pr-3">
					<div className="flex flex-col rounded-md bg-surface py-5 px-6">
						<div className="flex items-baseline justify-between">
							<span
								style={{
									background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
									WebkitBackgroundClip: "text",
									backgroundClip: "text",
									color: "transparent",
								}}
								className="pb-5 text-6xl font-semibold"
							>
								{assignment.title}
							</span>

							{assignment.state === "PUBLISHED" ? (
								<span className="relative bottom-[1px] mr-3 ml-6 flex-shrink-0 text-lg font-medium leading-none opacity-60">
									{assignment.dueDate
										? `Due ${formatDate(
												assignment.dueDate
										  )}`
										: "No due date"}
								</span>
							) : (
								<span className="relative bottom-[1px] mr-3 ml-6 flex-shrink-0 text-lg font-medium italic leading-none opacity-60">
									Draft
								</span>
							)}
						</div>

						<p className="px-1 pb-5 text-sm opacity-80">
							{assignment.description}
						</p>

						<div className="flex space-x-1.5">
							<ToggleButton
								onClick={() => setSubpage("feedback")}
								toggled={subpage === "feedback"}
							>
								Feedback
							</ToggleButton>

							{role === "teacher" && (
								<ToggleButton
									onClick={() => setSubpage("insights")}
									toggled={subpage === "insights"}
								>
									Insights
								</ToggleButton>
							)}
						</div>
					</div>

					<div className="flex flex-1 flex-col rounded-md bg-surface py-5 px-6">
						{subpage === "feedback" ? (
							role === "teacher" ? (
								<div>
									<div className="ml-1 mb-2 text-lg font-medium opacity-60">
										Instructions
									</div>

									{modal &&
										createPortal(modal, document.body)}

									{editingFeedbackInstructions && (
										<div className="flex space-x-1.5">
											{assignment.description && (
												<Button
													onClick={() =>
														assignment.description &&
														setFeedbackInstructionsInput(
															assignment.description
														)
													}
													disabled={
														(feedbackInstructionsInput?.length ??
															0) > 0
													}
												>
													Use assignment description
												</Button>
											)}

											{driveFiles.length > 0 && (
												<Button
													onClick={() =>
														setModal(
															<Modal
																title="Pick an attachment"
																onClose={() =>
																	setModal(
																		undefined
																	)
																}
															>
																<div className="flex flex-col space-y-2.5">
																	{driveFiles.map(
																		(
																			driveFile
																		) => (
																			<div
																				onClick={() =>
																					onPickAttachment(
																						{
																							id: driveFile.id,
																						}
																					)
																				}
																				key={
																					driveFile.id
																				}
																				className="flex h-20 cursor-pointer items-center rounded-md border-[0.75px] border-border pl-6 pr-8 transition-colors duration-150 hover:bg-surface-hover"
																			>
																				<img
																					src={
																						driveFile.thumbnailUrl
																					}
																					className="aspect-square h-12 rounded-full border-[0.75px] border-border"
																				/>

																				<div className="ml-3 flex flex-shrink flex-col">
																					<span className="mb-[1px] font-medium leading-none opacity-90">
																						{
																							driveFile.title
																						}
																					</span>

																					<Link
																						href={
																							driveFile.url
																						}
																						onClick={(
																							e
																						) =>
																							e.stopPropagation()
																						}
																						target="_blank"
																						className="w-min overflow-hidden overflow-ellipsis whitespace-nowrap text-sm opacity-60 hover:underline" // ellipsis not working yet
																					>
																						{
																							driveFile.url
																						}
																					</Link>
																				</div>
																			</div>
																		)
																	)}
																</div>
															</Modal>
														)
													}
													disabled={
														(feedbackInstructionsInput?.length ??
															0) > 0
													}
												>
													Use summary of assignment
													attachment
												</Button>
											)}

											<Button
												onClick={() =>
													setModal(
														<Modal
															title="Coming soon..."
															onClose={() =>
																setModal(
																	undefined
																)
															}
														>
															<span className="font-medium italic opacity-60">
																Ability to use
																summary of Drive
																document coming
																soon...
															</span>
														</Modal>
													)
												}
												disabled={
													(feedbackInstructionsInput?.length ??
														0) > 0
												}
											>
												Use summary from Drive document
											</Button>
										</div>
									)}

									<div className="mt-2.5">
										{editingFeedbackInstructions ? (
											<div className="h-48">
												<TextArea
													value={
														feedbackInstructionsInput
													}
													setValue={
														setFeedbackInstructionsInput
													}
													placeholder="Instructions to set up feedback"
													ref={instructionsInputRef}
												/>
											</div>
										) : (
											<div className="whitespace-pre-wrap rounded-md border-[1px] border-border bg-surface-bright py-1.5 px-3 font-medium opacity-80">
												{
													assignment.feedbackConfig
														?.instructions
													// not sure why typescript can't narrow type here
												}
											</div>
										)}

										<div className="mt-2.5">
											{editingFeedbackInstructions ? (
												<div className="flex space-x-2.5">
													<div className="w-48">
														<Button
															onClick={onDone}
															disabled={
																feedbackInstructionsInput.length ===
																0
															}
															fullWidth
														>
															Done
														</Button>
													</div>

													{changingFeedbackInstructions && (
														<div className="w-48">
															<Button
																onClick={
																	onCancel
																}
																fullWidth
															>
																Cancel
															</Button>
														</div>
													)}
												</div>
											) : (
												<div className="w-48">
													<Button
														onClick={onChange}
														fullWidth
													>
														Change
													</Button>
												</div>
											)}
										</div>
									</div>

									{assignment.feedbackConfig && (
										<>
											<div className="ml-1 mb-2 mt-2.5 text-lg font-medium opacity-60">
												Feedback link
											</div>

											<div className="w-48">
												<Button
													onClick={() => {
														navigator.clipboard.writeText(
															window.location.href
														);

														setShowLinkCopied(true);
													}}
													fullWidth
												>
													{showLinkCopied
														? "Link copied"
														: "Copy link"}
												</Button>
											</div>

											<div className="ml-1 mb-2 mt-2.5 text-lg font-medium opacity-60">
												Try out feedback
											</div>

											<div className="flex h-64 space-x-2.5">
												<div className="flex-1">
													<TextArea
														value={
															demoAssignmentInput
														}
														setValue={
															setDemoAssignmentInput
														}
														placeholder="Enter a test assignment to try out feedback"
														ref={
															demoAssignmentInputRef
														}
													/>
												</div>

												<div
													ref={demoFeedbackRef}
													className={clsx(
														"h-full flex-1 overflow-y-scroll whitespace-pre-wrap rounded-md border-[1px] border-border py-1.5 px-3 font-medium",
														processedDemoFeedback.length >
															0 ||
															(generatingDemoFeedback &&
																"bg-surface-bright"),
														processedDemoFeedback ===
															""
															? "opacity-30"
															: "opacity-80"
													)}
												>
													{processedDemoFeedback ===
														"" &&
													generatingDemoFeedback
														? "Generating..."
														: processedDemoFeedback}
												</div>
											</div>

											<div className="mt-2.5 flex space-x-2.5">
												<div className="w-48">
													<Button
														onClick={onGetFeedback}
														disabled={
															demoAssignmentInput.length ===
																0 ||
															generatingDemoFeedback ||
															processedDemoFeedback !==
																""
														}
														fullWidth
													>
														Get feedback
													</Button>
												</div>

												{demoFeedback.length > 0 &&
													!generatingDemoFeedback && (
														<div className="w-48">
															<Button
																onClick={
																	onTryAgain
																}
																fullWidth
															>
																Try again
															</Button>
														</div>
													)}
											</div>
										</>
									)}
								</div>
							) : (
								<div></div>
							)
						) : (
							<span className="font-medium italic opacity-60">
								Assignment insights coming soon...
							</span>
						)}
					</div>
				</div>
			)}
		</DefaultLayout>
	);
};

export default Assignment;
