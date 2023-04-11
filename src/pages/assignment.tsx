import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type NextPage } from "next";
import { TRPCClientError } from "@trpc/client";
import { useRouter } from "next/router";
import colors from "colors.cjs";
import { api } from "~/client/api";
import DefaultLayout from "~/client/modules/layout/DefaultLayout";
import clsx from "clsx";
import formatDate from "~/client/modules/shared/formatDate";
import Modal from "~/client/modules/shared/Modal";
import TextArea from "~/client/modules/shared/TextArea";
import ToggleButton from "~/client/modules/shared/ToggleButton";
import Button from "~/client/modules/shared/Button";
import fetchOpenaiStream from "~/client/modules/shared/fetchOpenAIStream";
import getFeedback from "~/client/modules/feedback/getFeedback";
import summarizeInstructions from "~/client/modules/feedback/summarizeInstructions";
import authenticateWithGoogle from "~/client/modules/auth/authenticateWithGoogle";
import useStickyState from "~/client/modules/shared/useStickyState";
import useSelectedCourse from "~/client/modules/courses/useSelectedCourse";
import StudentFeedback from "~/client/modules/feedback/StudentFeedback";
import Attachment from "~/client/modules/shared/Attachment";
import { event } from "~/client/modules/analytics/mixpanel";

// put some more thought into how to bring external content into site. perhaps not always the best idea for input to show up on main screen, and maybe would be better for it to show up as an attachment that can be opened up with a modal
// perhaps completely abstract away the creation of feedback instructions, and instead of showing actual instructions, just have user see list of things model is taking into account. not as transparent though, and users don't get to see summary being created
// consider letting users delete feedback
// todo - make loading indicators
const Assignment: NextPage = () => {
	const router = useRouter();

	const assignmentId = router.asPath.split("/").at(-1) as string;

	const courseId = router.asPath.split("/").at(-3) as string;

	const [notFoundMessage, setNotFoundMessage] = useState<string>();

	const { selectedCourse, role } = useSelectedCourse({
		selectedCourseId: courseId,
	});

	if (role === "none")
		notFoundMessage === undefined &&
			setNotFoundMessage(
				"You either do not have access to this course or it does not exist."
			);

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
					?.find((assignment) => assignment.id === assignmentId), //! providing initialData, even if it returns undefined, makes data not undefined. be careful!!
			onError: (error) =>
				error.data?.code === "NOT_FOUND" &&
				notFoundMessage === undefined &&
				setNotFoundMessage("This assignment does not exist"),
		}
	);

	const [modal, setModal] = useState<React.ReactNode>();

	const driveFiles = assignment?.materials
		.map((material) =>
			material.type === "driveFile" ? material.driveFile : undefined
		)
		.filter(Boolean);

	const onPickAttachment = async ({ id }: { id: string }) => {
		try {
			const googleDocText =
				await queryClient.feedback.getGoogleDocText.fetch({
					id,
				});

			summarizeInstructions({
				instructions: googleDocText,
				onContent: (content) => {
					setModal(undefined);

					setFeedbackInstructionsInput((prev) => prev + content);

					instructionsInputRef.current?.scroll({
						top: instructionsInputRef.current?.scrollHeight,
					});
				},
				onFinish: () => {},
			});
		} catch (error) {
			if (
				error instanceof TRPCClientError &&
				error.message === "FORBIDDEN"
			)
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

		event.feedbackConfig({
			courseId,
			assignmentId,
			instructions: feedbackInstructionsInput,
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

	const { data: priorFeedback } = api.feedback.getPriorFeedback.useQuery({
		courseId,
		assignmentId,
	}); // will return all student submissions if user is teacher of course. design more elegant solution later

	const { data: submissions } = api.feedback.getSubmissions.useQuery({
		courseId,
		assignmentId,
	});

	const onGetFeedback = () => {
		setGeneratingDemoFeedback(true);

		assignment.feedbackConfig &&
			profile &&
			selectedCourse &&
			getFeedback({
				assignment: demoAssignmentInput,
				instructions: assignment.feedbackConfig.instructions,
				studentName: profile.name,
				courseName: selectedCourse.name,
				onContent: (content) => {
					setDemoFeedback((prev) => prev + content);

					demoFeedbackRef.current?.scroll({
						top: demoFeedbackRef.current?.scrollHeight,
					});
				},
				onFinish: ({ rawFeedback }) => {
					setGeneratingDemoFeedback(false);

					event.feedbackDemo({
						courseId,
						assignmentId,
						rawFeedback,
					});
				},
			});
	};

	const onTryAgain = () => {
		setDemoFeedback("");

		process.nextTick(() => demoAssignmentInputRef.current?.select());
	};

	return (
		<DefaultLayout
			forceLoading={
				!assignment ||
				(role === "student" &&
					(priorFeedback === undefined || submissions === undefined))
			}
			selectedCourseId={courseId}
			notFoundMessage={notFoundMessage}
		>
			{assignment &&
				(role !== "student" ||
					(priorFeedback !== undefined &&
						submissions !== undefined)) && (
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

							<p className="select-text px-1 text-sm opacity-80">
								{assignment.description}
							</p>

							{role === "teacher" && (
								<div className="mt-5 flex space-x-1.5">
									<ToggleButton
										onClick={() => setSubpage("feedback")}
										toggled={subpage === "feedback"}
									>
										Feedback
									</ToggleButton>

									<ToggleButton
										onClick={() => setSubpage("insights")}
										toggled={subpage === "insights"}
									>
										Insights
									</ToggleButton>
								</div>
							)}
						</div>

						<div className="flex h-full flex-1 flex-col rounded-md bg-surface py-5 px-6">
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
														Use assignment
														description
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
																				<Attachment
																					title={
																						driveFile.title
																					}
																					url={
																						driveFile.url
																					}
																					thumbnailUrl={
																						driveFile.thumbnailUrl
																					}
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
																				/>
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
														Use summary of
														assignment attachment
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
																	Ability to
																	use summary
																	of Drive
																	document
																	coming
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
													Use summary from Drive
													document
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
														ref={
															instructionsInputRef
														}
													/>
												</div>
											) : (
												<div className="select-text whitespace-pre-wrap rounded-md border-[1px] border-border bg-surface-bright py-1.5 px-3 font-medium opacity-80">
													{
														assignment
															.feedbackConfig
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
																window.location
																	.href
															);

															setShowLinkCopied(
																true
															);
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
														{/*//! not sure if the extra button and not letting users type during generation is actually helpful */}
														{generatingDemoFeedback ||
														demoFeedback !== "" ? (
															<div className="h-full select-text overflow-y-scroll whitespace-pre-wrap rounded-md border-[1px] border-border bg-surface-bright py-1.5 px-3 font-medium opacity-80">
																{
																	demoAssignmentInput
																}
															</div>
														) : (
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
														)}
													</div>

													<div
														ref={demoFeedbackRef}
														className={clsx(
															"h-full flex-1 select-text overflow-y-scroll whitespace-pre-wrap rounded-md border-[1px] border-border py-1.5 px-3 font-medium",
															demoFeedback === ""
																? "opacity-30"
																: "bg-surface-bright opacity-80"
														)}
													>
														{demoFeedback === "" &&
														generatingDemoFeedback
															? "Analyzing document, this may take a minute..."
															: demoFeedback}
													</div>
												</div>

												<div className="mt-2.5 flex space-x-2.5">
													<div className="w-48">
														<Button
															onClick={
																onGetFeedback
															}
															disabled={
																demoAssignmentInput ===
																	"" ||
																generatingDemoFeedback ||
																demoFeedback !==
																	""
															}
															fullWidth
														>
															Get feedback
														</Button>
													</div>

													{demoFeedback !== "" &&
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
									priorFeedback &&
									submissions && // again, typescript can't narrow away undefined here
									selectedCourse &&
									profile &&
									(assignment.feedbackConfig !== undefined ? (
										<StudentFeedback
											priorFeedback={priorFeedback}
											submissions={submissions}
											instructions={
												assignment.feedbackConfig
													.instructions
											}
											courseName={selectedCourse.name}
											studentName={profile.name}
											courseId={courseId}
											assignmentId={assignmentId}
										/>
									) : (
										<span className="font-medium italic opacity-60">
											Your teacher hasn&apos;t set up
											feedback on this assignment yet
										</span>
									))
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
