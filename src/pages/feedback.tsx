import { type NextPage } from "next";
import { useRouter } from "next/router";
import { produce } from "immer";
import { renderToStaticMarkup } from "react-dom/server";
import { H } from "highlight.run";
import {
	useEffect,
	useState,
	useRef,
	forwardRef,
	useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import RowList from "~/client/modules/shared/RowList";
import { TRPCClientError } from "@trpc/client";
import { api, type RouterOutputs } from "~/client/api";
import DefaultLayout, {
	type DefaultLayoutRenderProps,
} from "~/client/modules/layout/DefaultLayout";
import Button from "~/client/modules/shared/Button";
import Modal from "~/client/modules/shared/Modal";
import Attachment from "~/client/modules/shared/Attachment";
import TextArea from "~/client/modules/shared/TextArea";
import authenticateWithGoogle from "~/client/modules/auth/authenticateWithGoogle";
import getFeedback from "~/client/modules/feedback/getFeedback";
import breakIntoSentences from "~/client/modules/shared/breakIntoSentences";
import { useFocusWithin, useHover } from "react-aria";
import clsx from "clsx";
import getFollowUp from "~/client/modules/feedback/getFollowup";

// ideally we'd show some scrollbars but unfortunately they look ugly. work around this in future
// consider adding more borders
// todo - add breadcrumbs, logo, and title above surface in background
// todo - make everything adjust when screen size changes
const FeedbackComponent: React.FC<DefaultLayoutRenderProps> = ({
	profile,
	courses,
	currentCourseId,
	currentRole,
	onNotFound,
}) => {
	const course =
		currentRole !== "none" // never will be false
			? courses[
					({ teacher: "teaching", student: "enrolled" } as const)[
						currentRole
					]
			  ].find((course) => course.id === currentCourseId)
			: undefined;

	const router = useRouter();

	const assignmentId = router.asPath.split("/").at(-1) as string;

	const assignment = course?.assignments.find(
		(assignment) => assignment.id === assignmentId
	);

	useEffect(() => {
		if (assignment === undefined)
			onNotFound(
				"You either do not have access to this assignment or it does not exist."
			);
	}, [assignment, onNotFound]);

	const priorFeedback =
		course &&
		assignment &&
		api.feedback.getPriorFeedback.useQuery(
			{
				courseId: course.id,
				assignmentId: assignment.id,
			},
			{
				onError: (error) => {
					if (
						error.data?.code === "UNAUTHORIZED" ||
						error.data?.code === "FORBIDDEN"
					)
						router.push("/signIn");
				},
			}
		).data; //! will return all student submissions if user is teacher of course. design more elegant solution later

	const submissions =
		course &&
		assignment &&
		api.feedback.getSubmissions.useQuery(
			{
				courseId: course.id,
				assignmentId: assignment.id,
			},
			{
				onError: (error) => {
					if (
						error.data?.code === "UNAUTHORIZED" ||
						error.data?.code === "FORBIDDEN"
					)
						router.push("/signIn");
				},
			}
		).data;

	return course && assignment && priorFeedback && submissions ? (
		assignment.feedbackConfig !== undefined ? (
			<FeedbackContent
				priorFeedback={priorFeedback}
				submissions={submissions}
				instructions={assignment.feedbackConfig.instructions}
				profile={profile}
				course={course}
				assignmentId={assignment.id}
				assignmentTitle={assignment.title}
			/>
		) : (
			<div className="flex h-screen space-y-2.5 py-2.5 pr-3">
				<div className="flex h-full w-full flex-col overflow-y-scroll overscroll-y-contain rounded-md bg-white px-48 py-16">
					<span className="font-medium italic opacity-60">
						Your teacher hasn&apos;t set up feedback on this
						assignment yet
					</span>
				</div>
			</div>
		)
	) : null;
};

const specificFeedbackHighlightDomIdPrefix = "specific-feedback";

const getDomIdOfSpecificFeedbackHighlight = ({
	paragraph,
	sentence,
}: {
	paragraph: number;
	sentence: number;
}) => `${specificFeedbackHighlightDomIdPrefix}-${paragraph}-${sentence}`;

const FeedbackContent: React.FC<{
	priorFeedback: RouterOutputs["feedback"]["getPriorFeedback"];
	submissions: RouterOutputs["feedback"]["getSubmissions"];
	instructions: string;
	profile: RouterOutputs["profile"]["me"];
	course:
		| RouterOutputs["courses"]["all"]["teaching"][0]
		| RouterOutputs["courses"]["all"]["enrolled"][0];
	assignmentId: string;
	assignmentTitle: string;
}> = ({
	priorFeedback,
	submissions,
	instructions,
	profile,
	course,
	assignmentId,
	assignmentTitle,
}) => {
	const submissionRef = useRef<{
		getText: () => string | undefined;
		getTextOffset: ({}: { paragraph: number }) => number;
		getWidth: () => number | undefined;
		setHTML: (html: string) => void;
	}>(null);

	const [submissionEmpty, setSubmissionEmpty] = useState(true);

	const [modal, setModal] = useState<"submission">();

	const [generating, setGenerating] = useState(false);

	const [generalFeedback, setGeneralFeedback] = useState("");

	const [specificFeedbackList, setSpecificFeedbackList] = useState<
		{
			paragraph: number;
			sentence: number;
			content: string;
			generating: boolean;
			followUps: string[];
			state: "focus" | "hover" | undefined;
		}[]
	>([]);

	const generalFeedbackScroller = useRef<HTMLDivElement>(null);

	const [submissionWidth, setSubmissionWidth] = useState<number>();

	const headerRef = useRef<HTMLDivElement>(null);

	const [headerHeight, setHeaderHeight] = useState<number>();

	useEffect(() => {
		// todo - make run on window resize
		if (submissionRef.current) {
			setSubmissionWidth(submissionRef.current.getWidth());
		}

		if (headerRef.current) {
			setHeaderHeight(headerRef.current.offsetHeight + 20);
		}
	}, []);

	const editing =
		!generating &&
		generalFeedback.length === 0 &&
		specificFeedbackList.length === 0;

	const submissionDriveFiles = submissions
		.map((submission) =>
			submission.type === "driveFile" ? submission.driveFile : undefined
		)
		.filter(Boolean);

	const queryClient = api.useContext();

	const onPickAttachment = async ({ id }: { id: string }) => {
		if (submissionRef.current)
			try {
				const googleDocHTML =
					await queryClient.feedback.getGoogleDocHTML.fetch({
						id,
					});

				submissionRef.current.setHTML(googleDocHTML);

				setModal(undefined);
			} catch (error) {
				if (
					error instanceof TRPCClientError &&
					error.message === "FORBIDDEN"
				)
					authenticateWithGoogle({
						permissions: ["drive"],
						redirectTo: window.location.href, //! not sure if working
					});
			}
	};

	const onGetFeedback = () => {
		const submissionInput = submissionRef.current?.getText();

		if (submissionInput !== undefined) {
			setGenerating(true);

			const start = new Date();

			let generatingStart: Date;

			getFeedback({
				submission: submissionInput,
				instructions,
				studentName: profile.name,
				courseName: course.name,
				onGeneralContent: (content) => {
					setGeneralFeedback(content);

					generalFeedbackScroller.current?.scroll({
						top: generalFeedbackScroller.current.scrollHeight,
					});
				},
				onSpecificContent: ({ content, paragraph, sentence }) => {
					if (generatingStart === undefined)
						generatingStart = new Date();

					setSpecificFeedbackList(
						produce((specificFeedbackList) => {
							const specificFeedback = specificFeedbackList.find(
								(specificFeedback) =>
									specificFeedback.paragraph === paragraph &&
									specificFeedback.sentence === sentence
							);

							if (specificFeedback) {
								specificFeedback.content = content;
							} else {
								specificFeedbackList.push({
									paragraph,
									sentence,
									content,
									generating: true,
									followUps: [],
									state: undefined,
								});
							}
						})
					);
				},
				onFinish: ({
					model,
					temperature,
					presencePenalty,
					frequencyPenalty,
					messages,
					rawResponse,
					outline,
					commentary,
					specificFeedback,
					generalFeedback,
				}) => {
					setGenerating(false);

					setSpecificFeedbackList(
						produce((specificFeedbackList) => {
							for (const specificFeedback of specificFeedbackList) {
								specificFeedback.generating = false;
							}
						})
					);

					setFeedbackResponse({
						rawResponse,
						outline,
						commentary,
						specificFeedback,
						generalFeedback,
					});

					H.track("Feedback", {
						courseId: course.id,
						assignmentId,
						model,
						temperature,
						presencePenalty,
						frequencyPenalty,
						messages: messages
							.map(
								(message) =>
									`Role: ${message.role}\nContent: ${message.content}`
							)
							.join("\n\n\n"),
						...(generatingStart
							? {
									secondsAnalyzing:
										(generatingStart.valueOf() -
											start.valueOf()) /
										1000,
							  }
							: {}),
						secondsGenerating:
							(new Date().valueOf() - generatingStart.valueOf()) /
							1000,
					});

					console.debug(rawResponse);
				},
			});
		}
	};

	const onTryAgain = () => {
		setSpecificFeedbackList([]);
		setGeneralFeedback("");
	};

	const [feedbackResponse, setFeedbackResponse] = useState<{
		rawResponse: string;
		outline: string;
		commentary: string;
		specificFeedback: string;
		generalFeedback: string;
	}>();

	const onGetFollowUp = ({
		paragraph,
		sentence,
		followUps,
	}: {
		paragraph: number;
		sentence: number;
		followUps: string[];
	}) => {
		if (feedbackResponse) {
			const start = new Date();

			setSpecificFeedbackList(
				produce((specificFeedbackList) => {
					const specificFeedback = specificFeedbackList.find(
						(specificFeedback) =>
							specificFeedback.paragraph === paragraph &&
							specificFeedback.sentence === sentence
					);

					if (specificFeedback) {
						specificFeedback.followUps = followUps;

						specificFeedback.generating = true;
					}
				})
			);

			getFollowUp({
				feedback:
					specificFeedbackList.find(
						(specificFeedback) =>
							specificFeedback.paragraph === paragraph &&
							specificFeedback.sentence === sentence
					)?.content ?? "",
				followUps,
				instructions,
				submission: submissionRef.current?.getText() ?? "",
				...feedbackResponse,
				onContent: (content) => {
					setSpecificFeedbackList(
						produce((specificFeedbackList) => {
							const specificFeedback = specificFeedbackList.find(
								(specificFeedback) =>
									specificFeedback.paragraph === paragraph &&
									specificFeedback.sentence === sentence
							);

							if (specificFeedback) {
								// relies on that user's followUps will be odd and gpt's will be even
								if (
									specificFeedback.followUps.length % 2 ===
									1
								) {
									specificFeedback.followUps.push(content);
								} else {
									specificFeedback.followUps[
										specificFeedback.followUps.length - 1
									] = content;
								}
							} else {
								console.error(
									"This shouldn't happen. followUp requested for specific feedback that doesn't exist"
								);
							}
						})
					);
				},
				onFinish: ({
					messages,
					model,
					temperature,
					presencePenalty,
					frequencyPenalty,
				}) => {
					// todo - add mixpanel event
					setSpecificFeedbackList(
						produce((specificFeedbackList) => {
							const specificFeedback = specificFeedbackList.find(
								(specificFeedback) =>
									specificFeedback.paragraph === paragraph &&
									specificFeedback.sentence === sentence
							);

							if (specificFeedback) {
								specificFeedback.generating = false;
							}
						})
					);

					H.track("Follow up", {
						assignmentId,
						courseId: course.id,
						messages: messages
							.map(
								(message) =>
									`Role: ${message.role}\nContent: ${message.content}`
							)
							.join("\n\n\n"),
						model,
						temperature,
						presencePenalty,
						frequencyPenalty,
						secondsGenerating:
							(new Date().valueOf() - start.valueOf()) / 1000,
					});
				},
			});
		}
	};

	return (
		<div className="flex h-screen space-y-2.5 py-2.5 pr-3">
			<div className="relative flex h-full w-full overflow-y-scroll overscroll-y-contain rounded-md border border-border bg-white pt-16 shadow-lg shadow-[#00000016]">
				<Modal
					title="Pick a submission"
					open={modal === "submission"}
					setOpen={(open) =>
						open ? setModal("submission") : setModal(undefined)
					}
				>
					<RowList
						items={submissionDriveFiles}
						onAction={(id) => onPickAttachment({ id })}
					>
						{({ item: driveFile }) => (
							<Attachment key={driveFile.id} {...driveFile} />
						)}
					</RowList>
				</Modal>

				<div
					style={{ marginTop: headerHeight ?? 0 }}
					className="flex-[0.75]"
				>
					<SpecificFeedbackColumn
						feedbackList={specificFeedbackList.filter(
							(_, index) => index % 2 === 1
						)}
						getSubmissionTextOffset={
							submissionRef.current
								? submissionRef.current.getTextOffset
								: () => 0
						}
						onGetFollowUp={onGetFollowUp}
						onStateChange={({ paragraph, sentence, update }) =>
							setSpecificFeedbackList(
								produce((feedbackList) => {
									const feedback = feedbackList.find(
										(feedback) =>
											feedback.paragraph === paragraph &&
											feedback.sentence === sentence
									);

									if (!feedback) return;

									feedback.state = update(feedback.state);
								})
							)
						}
					/>
				</div>

				<div className="relative flex basis-[704px] flex-col">
					<div
						ref={headerRef}
						className="min-h-12 flex items-end justify-between"
					>
						<div className="select-text text-2xl font-bold">
							{assignmentTitle}
						</div>

						{/* not sure why this is even necessary with justify-between */}
						<div className="flex-1" />

						<div className="flex-shrink-0">
							{submissionEmpty &&
							submissionDriveFiles.length > 0 ? (
								<Button onPress={() => setModal("submission")}>
									Use submission
								</Button>
							) : editing || generating ? (
								<Button
									onPress={onGetFeedback}
									disabled={submissionEmpty || generating}
								>
									{generating
										? specificFeedbackList.length > 0 ||
										  generalFeedback.length > 0
											? "Generating feedback..."
											: "Analyzing document..."
										: "Get feedback"}
								</Button>
							) : (
								<Button onPress={onTryAgain}>Try again</Button>
							)}
						</div>
					</div>

					<hr className="mt-2 mb-3" />

					<Submission
						editing={editing}
						onChangeEmpty={setSubmissionEmpty}
						specificFeedbackList={specificFeedbackList}
						onSpecificFeedbackStateChange={({
							paragraph,
							sentence,
							update,
						}) =>
							setSpecificFeedbackList(
								produce((feedbackList) => {
									const feedback = feedbackList.find(
										(feedback) =>
											feedback.paragraph === paragraph &&
											feedback.sentence === sentence
									);

									if (!feedback) return;

									feedback.state = update(feedback.state);
								})
							)
						}
						ref={submissionRef}
					/>

					<AnimatePresence>
						{generalFeedback.length > 0 && (
							<div className="absolute">
								<motion.div
									initial={{ opacity: 0, y: 25 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 25 }}
									transition={{
										duration: 0.35,
										ease: "easeOut",
									}}
									ref={generalFeedbackScroller}
									style={{
										width:
											submissionWidth &&
											submissionWidth + 8,
									}}
									className="fixed bottom-10 max-h-80 overflow-y-scroll overscroll-none rounded-md backdrop-blur-[6px]"
								>
									<div className="relative z-10 whitespace-pre-line rounded-md border border-border bg-surface px-4 py-2.5 opacity-80">
										<p className="select-text font-medium opacity-80 [overflow-wrap:anywhere]">
											{generalFeedback}
										</p>
									</div>
								</motion.div>
							</div>
						)}
					</AnimatePresence>
				</div>

				<div
					style={{ marginTop: headerHeight ?? 0 }}
					className="flex-1"
				>
					<SpecificFeedbackColumn
						feedbackList={specificFeedbackList.filter(
							(_, index) => index % 2 === 0
						)}
						getSubmissionTextOffset={
							submissionRef.current
								? submissionRef.current.getTextOffset
								: () => 0
						}
						onGetFollowUp={onGetFollowUp}
						onStateChange={({ paragraph, sentence, update }) =>
							setSpecificFeedbackList(
								produce((feedbackList) => {
									const feedback = feedbackList.find(
										(feedback) =>
											feedback.paragraph === paragraph &&
											feedback.sentence === sentence
									);

									if (!feedback) return;

									feedback.state = update(feedback.state);
								})
							)
						}
					/>
				</div>
			</div>
		</div>
	);
};

const Submission = forwardRef<
	{
		getText: () => string | undefined;
		getTextOffset: ({}: { paragraph: number }) => number;
		getWidth: () => number | undefined;
		setHTML: (html: string) => void;
	},
	{
		editing: boolean;
		onChangeEmpty: (empty: boolean) => void;
		specificFeedbackList: {
			paragraph: number;
			sentence: number;
			state: "focus" | "hover" | undefined;
		}[];
		onSpecificFeedbackStateChange: ({}: {
			paragraph: number;
			sentence: number;
			update: (
				prevState: "focus" | "hover" | undefined
			) => "focus" | "hover" | undefined;
		}) => void;
	}
>(
	(
		{
			editing,
			onChangeEmpty,
			specificFeedbackList,
			onSpecificFeedbackStateChange,
		},
		forwardedRef
	) => {
		const ref = useRef<HTMLDivElement>(null);

		const [
			previousSpecificFeedbackListLength,
			setPreviousSpecificFeedbackListLength,
		] = useState(0);

		if (
			previousSpecificFeedbackListLength !==
				specificFeedbackList.length &&
			ref.current !== null
		) {
			setPreviousSpecificFeedbackListLength(specificFeedbackList.length);

			for (const { paragraph, sentence } of specificFeedbackList) {
				const highlightId = getDomIdOfSpecificFeedbackHighlight({
					paragraph,
					sentence,
				});

				if (document.getElementById(highlightId) !== null) continue;

				let currentParagraphNumber = 0;

				for (const child of ref.current.children) {
					if (
						child.textContent !== null &&
						child.textContent.indexOf(".") !== -1 &&
						child.textContent.indexOf(".") !==
							child.textContent.lastIndexOf(".")
					) {
						currentParagraphNumber++;
					}

					if (currentParagraphNumber !== paragraph) continue;

					const precedingSpaces = (
						child.textContent?.match(/^\s+/g)?.[0] ?? ""
					).replaceAll(String.fromCharCode(160), "&nbsp;");

					const innerHTMLWithoutPrecedingSpaces =
						child.innerHTML.replace(precedingSpaces, "");

					child.innerHTML =
						precedingSpaces + innerHTMLWithoutPrecedingSpaces;

					const segment =
						sentence === -1
							? innerHTMLWithoutPrecedingSpaces.trim()
							: breakIntoSentences(
									innerHTMLWithoutPrecedingSpaces
							  )[sentence - 1]?.trim();

					if (segment === undefined) {
						console.error(
							"This shouldn't happen. Segment wasn't able to be found within html"
						);

						break;
					}

					const newParagraphHTML = child.innerHTML.replace(
						segment,
						renderToStaticMarkup(
							<span
								dangerouslySetInnerHTML={{ __html: segment }} //! use DOMPurify if submission html ever leaves browser
								id={highlightId}
								className="-my-1.5 -mx-1 select-text rounded-md bg-surface py-1.5 px-1 transition"
							/>
						)
					);

					child.innerHTML = newParagraphHTML;

					const highlightSpan = document.getElementById(highlightId);

					if (highlightSpan === null) {
						console.error(
							"This shouldn't happen. Span corresponding to feedback element should be in DOM"
						);

						break;
					}

					highlightSpan.addEventListener("click", () =>
						onSpecificFeedbackStateChange({
							paragraph,
							sentence,
							update: () => "focus",
						})
					);

					highlightSpan.addEventListener("pointerenter", () =>
						onSpecificFeedbackStateChange({
							paragraph,
							sentence,
							update: (prevState) =>
								prevState === "focus" ? "focus" : "hover",
						})
					);

					highlightSpan.addEventListener("pointerleave", () =>
						onSpecificFeedbackStateChange({
							paragraph,
							sentence,
							update: (prevState) =>
								prevState === "focus" ? "focus" : undefined,
						})
					);

					break;
				}
			}
		}

		useEffect(() => {
			if (ref.current !== null) {
				const div = ref.current;

				if (editing) {
					const removeHighlightSpansFromChildren = (
						element: Element
					) => {
						for (const child of element.children) {
							if (
								child.id.startsWith(
									specificFeedbackHighlightDomIdPrefix
								)
							) {
								element.innerHTML = element.innerHTML.replace(
									child.outerHTML,
									child.textContent ?? ""
								);
							} else {
								removeHighlightSpansFromChildren(child);
							}
						}

						// uncomment code below if submission should highlight

						// const selection = window.getSelection();

						// const range = document.createRange();

						// range.selectNodeContents(div);

						// selection?.removeAllRanges();

						// selection?.addRange(range);
					};

					removeHighlightSpansFromChildren(div);
				} else {
					const addSelectTextToChildren = (element: Element) => {
						for (const child of element.children) {
							child.classList.add("select-text");

							addSelectTextToChildren(child);
						}
					};

					addSelectTextToChildren(div);
				}
			}
		}, [editing]);

		const [previousSpecificFeedbackList, setPreviousSpecificFeedbackList] =
			useState(specificFeedbackList);

		useEffect(() => {
			if (previousSpecificFeedbackList !== specificFeedbackList) {
				setPreviousSpecificFeedbackList(specificFeedbackList);

				for (const currentSpecificFeedback of specificFeedbackList) {
					const previousSpecificFeedback =
						previousSpecificFeedbackList.find(
							(specificFeedback) =>
								specificFeedback.paragraph ===
									currentSpecificFeedback.paragraph &&
								specificFeedback.sentence ===
									currentSpecificFeedback.sentence
						);

					const highlightSpan = document.getElementById(
						getDomIdOfSpecificFeedbackHighlight({
							paragraph: currentSpecificFeedback.paragraph,
							sentence: currentSpecificFeedback.sentence,
						})
					);

					if (
						previousSpecificFeedback !== undefined &&
						previousSpecificFeedback.state !==
							currentSpecificFeedback.state &&
						highlightSpan !== null
					) {
						switch (currentSpecificFeedback.state) {
							case "focus":
								highlightSpan.classList.replace(
									"bg-surface",
									"bg-surface-selected-hover"
								);

								break;

							case "hover":
								highlightSpan.classList.replace(
									"bg-surface",
									"bg-surface-selected-hover"
								);

								break;

							case undefined:
								highlightSpan.classList.replace(
									"bg-surface-selected-hover",
									"bg-surface"
								);

								break;
						}
					}
				}
			}
		}, [previousSpecificFeedbackList, specificFeedbackList]);

		const [empty, setEmpty] = useState(true);

		useEffect(() => {
			if (ref.current) {
				const div = ref.current;

				div.focus();

				const handler = () => {
					const empty =
						div.innerHTML === "" ||
						div.innerHTML === "<br>" ||
						div.innerHTML === "<div><br></div>";

					setEmpty(empty);

					onChangeEmpty(empty);
				};

				div.addEventListener("input", handler);

				return () => {
					div.removeEventListener("input", handler);
				};
			}
		}, [ref, onChangeEmpty]);

		useImperativeHandle(
			forwardedRef,
			() => {
				return {
					getText: () => ref.current?.textContent ?? undefined,
					getTextOffset: ({ paragraph }) => {
						let offset = 0;

						let currentParagraphNumber = 0;

						if (ref.current !== null) {
							for (const child of ref.current.children) {
								if (
									child.textContent?.indexOf(".") !==
									child.textContent?.lastIndexOf(".")
								) {
									currentParagraphNumber++;
								}

								if (currentParagraphNumber === paragraph) {
									break;
								}

								offset += child.clientHeight;
							}
						}

						return offset;
					},
					setHTML: (html) => {
						if (ref.current) {
							const empty =
								html === "" ||
								html === "<br>" ||
								html === "<div><br></div>";

							setEmpty(empty);

							onChangeEmpty(empty);

							ref.current.innerHTML = html;
						}
					},
					getWidth: () => ref.current?.offsetWidth,
				};
			},
			[onChangeEmpty]
		);

		return (
			<div className="relative">
				<div
					contentEditable={editing}
					ref={ref}
					className="mb-[60vh]"
				/>

				{empty && (
					<span className="pointer-events-none absolute top-0 opacity-40">
						Your assignment goes here
					</span>
				)}
			</div>
		);
	}
);

Submission.displayName = "Submission";

const SpecificFeedbackColumn: React.FC<{
	feedbackList: {
		paragraph: number;
		sentence: number;
		content: string;
		generating: boolean;
		followUps: string[];
		state: "focus" | "hover" | undefined;
	}[];
	getSubmissionTextOffset: ({}: { paragraph: number }) => number;
	onGetFollowUp: ({}: {
		paragraph: number;
		sentence: number;
		followUps: string[];
	}) => void;
	onStateChange: ({}: {
		paragraph: number;
		sentence: number;
		update: (
			prevState: "focus" | "hover" | undefined
		) => "focus" | "hover" | undefined;
	}) => void;
}> = ({
	feedbackList,
	getSubmissionTextOffset,
	onGetFollowUp,
	onStateChange,
}) => {
	const ref = useRef<HTMLDivElement>(null);

	const [tops, setTops] = useState<number[]>([]);

	const [previousFeedbackListLength, setPreviousFeedbackListLength] =
		useState(0);

	if (previousFeedbackListLength !== feedbackList.length) {
		setPreviousFeedbackListLength(feedbackList.length);

		const newTops = [] as number[];

		for (const feedback of feedbackList) {
			let top = getSubmissionTextOffset({
				paragraph: feedback.paragraph,
			});

			const previousTop = newTops.at(-1);

			if (
				previousTop !== undefined &&
				ref.current?.lastElementChild?.firstElementChild !== null
			) {
				const prevHeight =
					ref.current?.lastElementChild?.firstElementChild
						.scrollHeight;

				top = Math.max(previousTop + (prevHeight ?? 0) + 8, top);
			}

			newTops.push(top);
		}

		setTops(newTops);
	}

	return (
		<div ref={ref} className="relative min-w-[192px]">
			<AnimatePresence>
				{feedbackList.map((feedback, index) => (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						transition={{
							duration: 0.35,
							ease: "easeOut",
						}}
						key={`${feedback.paragraph},${feedback.sentence}`}
						style={{ top: tops[index] }}
						className="absolute left-4 right-4"
					>
						<SpecificFeedbackItem
							content={feedback.content}
							generating={feedback.generating}
							followUps={feedback.followUps}
							onGetFollowUp={(followUps) =>
								onGetFollowUp({
									paragraph: feedback.paragraph,
									sentence: feedback.sentence,
									followUps,
								})
							}
							state={feedback.state}
							onStateChange={(update) =>
								onStateChange({
									paragraph: feedback.paragraph,
									sentence: feedback.sentence,
									update: (prevState) => update(prevState),
								})
							}
						/>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
};

SpecificFeedbackColumn.displayName = "SpecificFeedbackColumn";

const SpecificFeedbackItem: React.FC<{
	content: string;
	generating: boolean;
	followUps: string[];
	onGetFollowUp: (followUps: string[]) => void;
	state: "focus" | "hover" | undefined;
	onStateChange: (
		update: (
			prevState: "focus" | "hover" | undefined
		) => "focus" | "hover" | undefined
	) => void;
}> = ({
	content,
	generating,
	followUps,
	onGetFollowUp: onGetFollowUpProp,
	state,
	onStateChange,
}) => {
	const [followUpInput, setFollowUpInput] = useState("");

	// highlighting text isn't considered focusWithin so if state is focus and then text is highlighted state goes to undefined
	const { focusWithinProps } = useFocusWithin({
		onFocusWithinChange: (isFocusWithin) =>
			onStateChange((prevState) =>
				isFocusWithin
					? "focus"
					: isHovered || prevState === "hover"
					? "hover"
					: undefined
			),
	});

	const { hoverProps, isHovered } = useHover({
		onHoverChange: (isHovering) =>
			onStateChange((prevState) =>
				prevState === "focus"
					? "focus"
					: isHovering
					? "hover"
					: undefined
			),
	});

	useEffect(() => {
		if (
			scrollerRef.current !== null &&
			Math.abs(
				scrollerRef.current.scrollHeight -
					scrollerRef.current.scrollTop -
					scrollerRef.current.clientHeight
			) < 50
		) {
			scrollerRef.current?.scroll({
				top: scrollerRef.current.scrollHeight,
			});
		}
	}, [followUps]); // consider doing something similar for content

	const onGetFollowUp = () => {
		if (generating) return;

		onGetFollowUpProp([...followUps, followUpInput]);

		setFollowUpInput("");

		scrollerRef.current?.scroll({
			top: scrollerRef.current.scrollHeight,
		});
	};

	const scrollerRef = useRef<HTMLDivElement>(null);

	const inputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (state === "focus") inputRef.current?.focus();
	}, [state]);

	return (
		<div
			{...focusWithinProps}
			{...hoverProps}
			className={clsx(
				"group absolute flex flex-col rounded-md border border-border bg-surface opacity-80 shadow-[#E5E5E5] backdrop-blur-sm transition-shadow duration-500",
				state === "focus" && "shadow-lg",
				state === "hover" && "shadow-lg"
			)}
		>
			<div
				ref={scrollerRef}
				onClick={() => onStateChange(() => "focus")}
				className="max-h-[384px] overflow-y-scroll overscroll-none"
			>
				<div className="px-3 py-2">
					<span className="select-text">{content}</span>
				</div>

				{followUps.map((followUp, index) => (
					// ok to use index as key because it functions as each followUp's id and shouldn't change
					// figure out if 1px or 0.75px border looks better
					<div
						key={index}
						className="border-t border-border px-3 py-2 even:font-medium even:opacity-50"
					>
						<p className="select-text [overflow-wrap:anywhere]">
							{followUp}
						</p>
					</div>
				))}
			</div>

			<div
				style={{
					height:
						state === "focus" || state === "hover"
							? (inputRef.current?.offsetHeight ?? 0) + 9
							: 0,
				}}
				className={clsx(
					"overflow-hidden rounded-b-md bg-surface-hover transition-all",
					state === undefined && "delay-150"
				)}
			>
				<div className="border-t border-border p-1">
					<TextArea
						value={followUpInput}
						setValue={setFollowUpInput}
						placeholder={
							generating ? "Generating..." : "Say something"
						}
						onEnter={onGetFollowUp}
						ref={inputRef}
					/>
				</div>
			</div>
		</div>
	);
};

const Feedback: NextPage = () => {
	return <DefaultLayout Component={FeedbackComponent} />;
};

export default Feedback;
