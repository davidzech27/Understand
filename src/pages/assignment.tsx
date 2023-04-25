import { useEffect, useRef, useState } from "react";
import { type NextPage } from "next";
import { TRPCClientError } from "@trpc/client";
import { H } from "highlight.run";
import { useRouter } from "next/router";
import colors from "colors.cjs";
import { RouterOutputs, api } from "~/client/api";
import DefaultLayout, {
	type DefaultLayoutRenderProps,
} from "~/client/modules/layout/DefaultLayout";
import formatDate from "~/client/modules/shared/formatDate";
import Modal from "~/client/modules/shared/Modal";
import TextArea from "~/client/modules/shared/TextArea";
import ToggleButton from "~/client/modules/shared/ToggleButton";
import Button from "~/client/modules/shared/Button";
import authenticateWithGoogle from "~/client/modules/auth/authenticateWithGoogle";
import useStickyState from "~/client/modules/shared/useStickyState";
import Attachment from "~/client/modules/shared/Attachment";
import RowList from "~/client/modules/shared/RowList";

// put some more thought into how to bring external content into site. perhaps not always the best idea for input to show up on main screen, and maybe would be better for it to show up as an attachment that can be opened up with a modal
// perhaps completely abstract away the creation of feedback instructions, and instead of showing actual instructions, just have user see list of things model is taking into account. not as transparent though, and users don't get to see summary being created
// consider letting users delete feedback
// todo - make loading indicators
const AssignmentComponent: React.FC<DefaultLayoutRenderProps> = ({
	courses,
	currentCourseId,
	currentRole,
	onNotFound,
}) => {
	const router = useRouter();

	const assignmentId = router.asPath.split("/").at(-1) as string;

	const course =
		currentRole !== "none" // never will be false
			? courses[
					({ teacher: "teaching", student: "enrolled" } as const)[
						currentRole
					] // checking in both places so that student knows if the assignment exists or not
			  ].find((course) => course.id === currentCourseId)
			: undefined;

	const assignment = course?.assignments.find(
		(assignment) => assignment.id === assignmentId
	);

	useEffect(() => {
		if (currentRole === "student" && assignment !== undefined)
			router.push(`/course/${currentCourseId}/feedback/${assignment.id}`);
		else if (assignment === undefined)
			onNotFound(
				"You either do not have access to this assignment or it does not exist."
			);
	}, [assignment, currentCourseId, currentRole, onNotFound, router]);

	return course && assignment ? (
		<AssignmentContent course={course} assignment={assignment} />
	) : null;
};

const AssignmentContent: React.FC<{
	course: (
		| RouterOutputs["courses"]["all"]["teaching"]
		| RouterOutputs["courses"]["all"]["enrolled"]
	)[0];
	assignment: (
		| RouterOutputs["courses"]["all"]["teaching"]
		| RouterOutputs["courses"]["all"]["enrolled"]
	)[0]["assignments"][0];
}> = ({ course, assignment }) => {
	const [subpage, setSubpage] = useStickyState<"feedback" | "insights">(
		"feedback",
		`course:${course.id}:${assignment.id}:subpage`
	);

	const [modal, setModal] = useState<"attachment" | "drive">();

	const queryClient = api.useContext();

	const driveFiles = assignment.materials
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

			setModal(undefined);

			setFeedbackInstructionsInput(googleDocText);

			instructionsInputRef.current?.scroll({
				// not sure if still necessary
				top: instructionsInputRef.current?.scrollHeight,
			});
		} catch (error) {
			if (
				error instanceof TRPCClientError &&
				error.message === "FORBIDDEN"
			) {
				authenticateWithGoogle({
					permissions: ["drive"],
					redirectTo: window.location.href,
				});
			}
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
		changingFeedbackInstructions || !assignment.feedbackConfig;

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
			assignmentId: assignment.id,
			courseId: course.id,
			instructions: feedbackInstructionsInput,
		});

		setChangingFeedbackInstructions(false); // confusing system. only matters if instructions previously existed

		const assignmentNew = {
			...assignment,
			feedbackConfig: {
				instructions: feedbackInstructionsInput,
			},
		};

		queryClient.courses.all.setData(undefined, (prev) => {
			// should always be true
			if (prev) {
				const { teaching, enrolled } = prev;

				const courseIndex = teaching.findIndex(
					(c) => c.id === course.id
				);

				const assignmentIndex = course.assignments.findIndex(
					(a) => a.id === assignment.id
				);

				return {
					teaching: [
						...teaching.slice(0, courseIndex),
						{
							...course,
							assignments: [
								...course.assignments.slice(0, assignmentIndex),
								assignmentNew,
								...course.assignments.slice(
									assignmentIndex + 1
								),
							],
						},
						...teaching.slice(courseIndex + 1),
					],
					enrolled,
				};
			} else {
				return undefined;
			}
		});

		H.track("Configure feedback", {
			courseId: course.id,
			assignmentId: assignment.id,
			instructions: feedbackInstructionsInput,
		});
	};

	const onCancel = () => setChangingFeedbackInstructions(false);

	const [showLinkCopied, setShowLinkCopied] = useState(false);

	return (
		<div className="flex min-h-screen flex-col space-y-2.5 py-2.5 pr-3">
			<div className="flex flex-col rounded-md border border-border bg-surface py-5 px-6">
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
								? `Due ${formatDate(assignment.dueDate)}`
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

				<div className="mt-5 flex space-x-1.5">
					<ToggleButton
						onPress={() => setSubpage("feedback")}
						toggled={subpage === "feedback"}
					>
						Feedback
					</ToggleButton>

					<ToggleButton
						onPress={() => setSubpage("insights")}
						toggled={subpage === "insights"}
					>
						Insights
					</ToggleButton>
				</div>
			</div>

			<div className="flex h-full flex-1 flex-col rounded-md border border-border bg-surface py-5 px-6 shadow-lg shadow-[#00000016]">
				{subpage === "feedback" ? (
					<div>
						<label
							htmlFor="feedbackInstructionsInput"
							className="ml-1 mb-2 block text-lg font-medium opacity-60"
						>
							Instructions
						</label>

						<Modal
							title="Pick an attachment"
							open={modal === "attachment"}
							setOpen={(open) =>
								open
									? setModal("attachment")
									: setModal(undefined)
							}
						>
							<RowList
								items={driveFiles}
								onAction={(id) => onPickAttachment({ id })}
							>
								{({ item: driveFile }) => (
									<Attachment {...driveFile} />
								)}
							</RowList>
						</Modal>

						<Modal
							title="Coming soon..."
							open={modal === "drive"}
							setOpen={(open) =>
								open ? setModal("drive") : setModal(undefined)
							}
						>
							<span className="font-medium italic opacity-60">
								Ability to use summary of Drive document coming
								soon...
							</span>
						</Modal>

						{editingFeedbackInstructions && (
							<div className="flex space-x-1.5">
								{assignment.description && (
									<Button
										onPress={() =>
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
										onPress={() => setModal("attachment")}
										disabled={
											(feedbackInstructionsInput?.length ??
												0) > 0
										}
									>
										Use assignment attachment
									</Button>
								)}

								<Button
									onPress={() => setModal("drive")}
									disabled={
										(feedbackInstructionsInput?.length ??
											0) > 0
									}
								>
									Use Drive file
								</Button>
							</div>
						)}

						<div className="mt-2.5">
							{editingFeedbackInstructions ? (
								<TextArea
									value={feedbackInstructionsInput}
									setValue={setFeedbackInstructionsInput}
									placeholder="Instructions to set up feedback"
									id="feedbackInstructionsInput"
									ref={instructionsInputRef}
								/>
							) : (
								<div className="select-text whitespace-pre-wrap rounded-md border-[1px] border-border bg-surface-bright py-1.5 px-3 font-medium opacity-80">
									{
										assignment.feedbackConfig?.instructions
										// not sure why typescript can't narrow type here
									}
								</div>
							)}

							<div className="mt-2.5">
								{editingFeedbackInstructions ? (
									<div className="flex space-x-2.5">
										<div className="w-48">
											<Button
												onPress={onDone}
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
													onPress={onCancel}
													fullWidth
												>
													Cancel
												</Button>
											</div>
										)}
									</div>
								) : (
									<div className="w-48">
										<Button onPress={onChange} fullWidth>
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
										onPress={() => {
											navigator.clipboard.writeText(
												window.location.href.replace(
													"assignment",
													"feedback"
												)
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
							</>
						)}
					</div>
				) : (
					<span className="font-medium italic opacity-60">
						Assignment insights coming soon...
					</span>
				)}
			</div>
		</div>
	);
};

const Assignment: NextPage = () => {
	return <DefaultLayout Component={AssignmentComponent} />;
};

export default Assignment;
