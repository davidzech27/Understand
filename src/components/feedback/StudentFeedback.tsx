import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { TRPCClientError } from "@trpc/client";
import TextArea from "../shared/TextArea";
import Button from "../shared/Button";
import clsx from "clsx";
import { type RouterOutputs } from "~/lib/trpc";
import Modal from "../shared/Modal";
import Attachment from "../shared/Attachment";
import { api } from "~/lib/trpc";
import fetchOpenaiStream from "~/lib/fetchOpenaiStream";
import { getFeedbackPrompt } from "~/prompts";
import authenticateWithGoogle from "~/lib/authenticateWithGoogle";

interface Props {
	priorFeedback: RouterOutputs["feedback"]["getPriorFeedback"];
	submissions: RouterOutputs["feedback"]["getSubmissions"];
	instructions: string;
	studentName: string;
	courseName: string;
}

const StudentFeedback: React.FC<Props> = ({
	submissions,
	instructions,
	studentName,
	courseName,
}) => {
	const [assignmentInput, setAssignmentInput] = useState("");

	const assignmentInputRef = useRef<HTMLTextAreaElement>(null);

	const [modal, setModal] = useState<React.ReactNode>();

	const [generatingFeedback, setGeneratingFeedback] = useState(false);

	const [feedback, setFeedback] = useState("");

	const processedFeedback = (() => {
		const indexOfFeedbackBeginning = feedback.indexOf("Step 2");

		if (indexOfFeedbackBeginning === -1) return "";

		return feedback
			.slice(indexOfFeedbackBeginning)
			.split("\n")
			.slice(1)
			.join("\n")
			.trim();
	})();

	const feedbackRef = useRef<HTMLDivElement>(null);

	const driveFiles = submissions
		.map((submission) =>
			submission.type === "driveFile" ? submission.driveFile : undefined
		)
		.filter(Boolean);

	const queryClient = api.useContext();

	const onPickAttachment = async ({ id }: { id: string }) => {
		try {
			const googleDocText =
				await queryClient.feedback.getGoogleDocText.fetch({
					id,
				});

			setAssignmentInput(googleDocText);

			setModal(false);
		} catch (error) {
			if (
				error instanceof TRPCClientError &&
				error.message === "FORBIDDEN"
			)
				authenticateWithGoogle({
					permissions: ["drive"],
					redirectTo: window.location.href, //! not working
				});
		}
	};

	const onGetFeedback = () => {
		setGeneratingFeedback(true);

		fetchOpenaiStream({
			...getFeedbackPrompt({
				assignment: assignmentInput,
				instructions,
				studentName,
				courseName,
			}),
			onContent: (content) => {
				setFeedback((prev) => prev + content);

				feedbackRef.current?.scroll({
					top: feedbackRef.current?.scrollHeight,
				});
			},
			onFinish: () => setGeneratingFeedback(false),
		});
	};

	const onTryAgain = () => {
		setFeedback("");

		process.nextTick(() => assignmentInputRef.current?.select());
	};

	return (
		<div className="flex flex-col">
			{modal && createPortal(modal, document.body)}

			{driveFiles.length > 0 && ( // change when there are other buttons
				<div className="mb-2.5 flex space-x-1.5">
					<Button
						onClick={() =>
							setModal(
								<Modal
									title="Pick an attachment"
									onClose={() => setModal(undefined)}
								>
									<div className="flex flex-col space-y-2.5">
										{driveFiles.map((driveFile) => (
											<Attachment
												title={driveFile.title}
												url={driveFile.url}
												thumbnailUrl={
													driveFile.thumbnailUrl
												}
												onClick={() =>
													onPickAttachment({
														id: driveFile.id,
													})
												}
												key={driveFile.id}
											/>
										))}
									</div>
								</Modal>
							)
						}
						disabled={assignmentInput !== ""}
					>
						Use Google Classroom submission
					</Button>
				</div>
			)}

			<div className="h-64">
				{generatingFeedback || processedFeedback !== "" ? (
					<div className="h-full select-text overflow-y-scroll whitespace-pre-wrap rounded-md border-[1px] border-border bg-surface-bright py-1.5 px-3 font-medium opacity-80">
						{assignmentInput}
					</div>
				) : (
					<TextArea
						value={assignmentInput}
						setValue={setAssignmentInput}
						placeholder="Your assignment goes here..."
						ref={assignmentInputRef}
					/>
				)}
			</div>

			<div
				ref={feedbackRef}
				className={clsx(
					"mt-2.5 h-64 select-text overflow-y-scroll whitespace-pre-wrap rounded-md border-[1px] border-border py-1.5 px-3 font-medium",
					processedFeedback === ""
						? "opacity-30"
						: "bg-surface-bright opacity-80"
				)}
			>
				{processedFeedback === "" && generatingFeedback
					? "Analyzing document, this may take a minute..."
					: processedFeedback}
			</div>

			<div className="mt-2.5 flex space-x-2.5">
				<div className="w-48">
					<Button
						onClick={onGetFeedback}
						disabled={
							assignmentInput === "" ||
							generatingFeedback ||
							processedFeedback !== ""
						}
						fullWidth
					>
						Get feedback
					</Button>
				</div>

				{processedFeedback !== "" && !generatingFeedback && (
					<div className="w-48">
						<Button onClick={onTryAgain} fullWidth>
							Try again
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

export default StudentFeedback;
