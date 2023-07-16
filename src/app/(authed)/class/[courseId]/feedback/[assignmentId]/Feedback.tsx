"use client"
import {
	useRef,
	useState,
	useEffect,
	useImperativeHandle,
	forwardRef,
	CSSProperties,
} from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { produce } from "immer"
import { motion, AnimatePresence } from "framer-motion"
import { useZact } from "zact/client"
import { useFocusWithin, useHover } from "react-aria"

import getFeedback from "~/ai/getFeedback"
import getFollowup from "~/ai/getFollowup"
import Modal from "~/components/Modal"
import SelectList from "~/components/SelectList"
import AttachmentItem from "~/components/AttachmentItem"
import Button from "~/components/Button"
import TextArea from "~/components/TextArea"
import breakIntoSentences from "~/utils/breakIntoSentences"
import cn from "~/utils/cn"
import registerFeedbackAction from "./registerFeedbackAction"
import registerFollowUpAction from "./registerFollowUpAction"
import registerInsightsAction from "./registerInsightsAction"
import colors from "colors.cjs"
import getInsights from "~/ai/getInsights"
import formatDate from "~/utils/formatDate"
import updateFeedbackSubmissionAction from "./updateFeedbackSubmissionAction"

interface Props {
	assignment: {
		courseId: string
		assignmentId: string
		title: string
		description?: string
		instructions: string
		context?: string
		dueAt?: Date
		linkedUrl?: string
	}
	feedbackHistory: {
		givenAt: Date
		submissionHTMLPromise: Promise<string>
		specificFeedbackListPromise: Promise<
			{
				content: string
				followUps: string[]
				paragraph: number
				sentence: number
			}[]
		>
		generalFeedbackPromise: Promise<{
			content: string
			followUps: string[]
		}>
		rawResponsePromise: Promise<string>
	}[]
	email: string
	profileName: string
	courseName: string
	role: "teacher" | "student"
	submissions: {
		id: string
		title?: string
		url: string
		thumbnailUrl?: string
		html: Promise<string>
	}[]
}

const specificFeedbackHighlightDomIdPrefix = "specific-feedback"

const getDomIdOfSpecificFeedbackHighlight = ({
	paragraph,
	sentence,
}: {
	paragraph: number
	sentence: number
}) => `${specificFeedbackHighlightDomIdPrefix}-${paragraph}-${sentence}`

function Feedback({
	assignment,
	feedbackHistory: feedbackHistoryProp,
	email,
	profileName,
	courseName,
	role,
	submissions,
}: Props) {
	const [feedbackHistory, setFeedbackHistory] = useState(feedbackHistoryProp)

	const [selectedFeedbackGivenAt, setSelectedFeedbackGivenAt] =
		useState<Date>()

	const [copiedFeedbackLinkGivenAt, setCopiedFeedbackLinkGivenAt] =
		useState<Date>()

	useEffect(() => {
		if (selectedFeedbackGivenAt === undefined) {
			submissionRef.current?.setHTML("")

			setSpecificFeedbackList([])

			setGeneralFeedback(undefined)
		} else {
			const feedbackInfo = feedbackHistory.find(
				({ givenAt }) =>
					givenAt.valueOf() === selectedFeedbackGivenAt.valueOf()
			)

			feedbackInfo &&
				(async () => {
					submissionRef.current?.setHTML(
						await feedbackInfo.submissionHTMLPromise
					)

					setUnrevisedSubmission(submissionRef.current?.getText())

					const rawResponse = await feedbackInfo.rawResponsePromise

					const lines = rawResponse.split("\n")

					const headerLineIndex = {
						commentary: lines.findIndex(
							(line) => line.search(/^Commentary:?\s*$/) !== -1
						),
						specificFeedback: lines.findIndex(
							(line) =>
								line.search(/^Specific Feedback:?\s*$/) !== -1
						),
						generalFeedback: lines.findIndex(
							(line) =>
								line.search(/^General Feedback:?\s*$/) !== -1
						),
					}

					setFeedbackResponse({
						rawResponse: rawResponse,
						synopsis: lines
							.slice(1, headerLineIndex.commentary)
							.join("\n")
							.trim(),
						commentary: lines
							.slice(
								headerLineIndex.commentary + 1,
								headerLineIndex.specificFeedback
							)
							.join("\n")
							.trim(),
						specificFeedback: lines
							.slice(
								headerLineIndex.specificFeedback + 1,
								headerLineIndex.generalFeedback
							)
							.join("\n")
							.trim(),
						generalFeedback: lines
							.slice(headerLineIndex.generalFeedback + 1)
							.join("\n")
							.trim(),
					})

					setSpecificFeedbackList(
						(
							(await feedbackInfo.specificFeedbackListPromise) ??
							[]
						).map((specificFeedback) => ({
							...specificFeedback,
							generating: false,
							state: undefined,
						}))
					)

					setGeneralFeedback({
						...(await feedbackInfo.generalFeedbackPromise),
						generating: false,
						state: undefined,
					})
				})()
		}
	}, [selectedFeedbackGivenAt, feedbackHistory])

	const submissionRef = useRef<{
		getText: () => string | undefined
		getTextOffset: ({}: { paragraph: number }) => number
		getWidth: () => number | undefined
		getHTML: () => string
		setHTML: (html: string) => void
	}>(null)

	const [submissionEmpty, setSubmissionEmpty] = useState(true)

	const [modal, setModal] = useState<"submission">()

	const [generating, setGenerating] = useState(false)

	const [generalFeedback, setGeneralFeedback] = useState<
		| {
				content: string
				generating: boolean
				followUps: string[]
				state: "focus" | "hover" | undefined
		  }
		| undefined
	>(undefined)

	const [specificFeedbackList, setSpecificFeedbackList] = useState<
		{
			paragraph: number
			sentence: number
			content: string
			generating: boolean
			followUps: string[]
			state: "focus" | "hover" | undefined
		}[]
	>([])

	const [submissionWidth, setSubmissionWidth] = useState<number>()

	const headerRef = useRef<HTMLDivElement>(null)

	const [headerHeight, setHeaderHeight] = useState<number>()

	useEffect(() => {
		const positionContent = () => {
			if (submissionRef.current) {
				setSubmissionWidth(submissionRef.current.getWidth())
			}

			if (headerRef.current) {
				setHeaderHeight(headerRef.current.offsetHeight + 20) //!
			}
		}

		positionContent()

		window.addEventListener("resize", positionContent)

		return () => {
			window.removeEventListener("resize", positionContent)
		}
	}, [])

	const editing = !generating

	const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>()

	const onPickAttachment = async () => {
		if (submissionRef.current) {
			const html = await submissions.find(
				(submission) => submission.id === selectedAttachmentId
			)?.html

			submissionRef.current.setHTML(html ?? "")

			setModal(undefined)
		}
	}

	const { mutate: registerFeedback, data: feedbackData } = useZact(
		registerFeedbackAction
	)

	useEffect(() => {
		if (
			feedbackData?.givenAt &&
			feedbackHistory.at(-1)?.givenAt.valueOf() !==
				feedbackData?.givenAt.valueOf() &&
			generalFeedback !== undefined
		) {
			setFeedbackHistory((feedbackHistory) => [
				...feedbackHistory,
				{
					givenAt: feedbackData.givenAt,
					submissionHTMLPromise: Promise.resolve(
						submissionRef.current?.getHTML() ?? ""
					),
					specificFeedbackListPromise:
						Promise.resolve(specificFeedbackList),
					generalFeedbackPromise: Promise.resolve(generalFeedback),
					rawResponsePromise: Promise.resolve(
						feedbackResponse?.rawResponse ?? ""
					),
				},
			])

			setSelectedFeedbackGivenAt(feedbackData.givenAt)
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps -- feedbackData and feedbackHistory will change after specificFeedbackList and generalFeedback
	}, [feedbackData, feedbackHistory])

	const [unrevisedSubmission, setUnrevisedSubmission] = useState<string>()

	const selectedFeedbackGivenAtRef = useRef<Date>()

	useEffect(() => {
		selectedFeedbackGivenAtRef.current = selectedFeedbackGivenAt
	}, [selectedFeedbackGivenAt])

	const onGetFeedback = () => {
		const submissionInput = submissionRef.current?.getText()

		const submissionHTML = submissionRef.current?.getHTML()

		if (submissionInput !== undefined) {
			setGenerating(true)

			const start = new Date()

			let producingStart: Date

			getFeedback({
				submission: submissionInput,
				instructions: assignment.instructions,
				studentName: profileName,
				courseName,
				onGeneralContent: (content) => {
					setGeneralFeedback((generalFeedback) => ({
						content,
						followUps: [],
						generating: true,
						state: generalFeedback?.state ?? undefined,
					}))
				},
				onSpecificContent: ({ content, paragraph, sentence }) => {
					if (producingStart === undefined)
						producingStart = new Date()

					setSpecificFeedbackList(
						produce((specificFeedbackList) => {
							const specificFeedback = specificFeedbackList.find(
								(specificFeedback) =>
									specificFeedback.paragraph === paragraph &&
									specificFeedback.sentence === sentence
							)

							if (specificFeedback) {
								specificFeedback.content = content
							} else {
								specificFeedbackList.push({
									paragraph,
									sentence,
									content,
									generating: true,
									followUps: [],
									state: undefined,
								})
							}
						})
					)
				},
				onFinish: ({
					model,
					temperature,
					presencePenalty,
					frequencyPenalty,
					messages,
					rawResponse,
					synopsis,
					commentary,
					specificFeedback,
					generalFeedback,
				}) => {
					setGenerating(false)

					setGeneralFeedback(
						(generalFeedback) =>
							generalFeedback && {
								...generalFeedback,
								generating: false,
							}
					)

					setSpecificFeedbackList(
						produce((specificFeedbackList) => {
							for (const specificFeedback of specificFeedbackList) {
								specificFeedback.generating = false
							}
						})
					)

					setFeedbackResponse({
						rawResponse,
						synopsis,
						commentary,
						specificFeedback,
						generalFeedback,
					})

					registerFeedback({
						courseId: assignment.courseId,
						assignmentId: assignment.assignmentId,
						submissionHTML: submissionHTML ?? "",
						rawResponse,
						metadata: {
							model,
							temperature,
							presencePenalty,
							frequencyPenalty,
							messages,
							...(producingStart
								? {
										secondsAnalyzing:
											(producingStart.valueOf() -
												start.valueOf()) /
											1000,
								  }
								: {}),
							...(producingStart
								? {
										secondsProducing:
											(new Date().valueOf() -
												producingStart.valueOf()) /
											1000,
								  }
								: {}),
						},
					})

					console.info(rawResponse)

					if (role === "student")
						getInsights({
							submission: submissionInput,
							instructions: assignment.instructions,
							specificFeedback,
							generalFeedback,
						}).then(({ insights, rawResponse }) => {
							console.info(rawResponse)

							if (selectedFeedbackGivenAtRef.current)
								registerInsightsAction({
									courseId: assignment.courseId,
									assignmentId: assignment.assignmentId,
									givenAt: selectedFeedbackGivenAtRef.current,
									submissionHTML: submissionHTML ?? "",
									insights,
								})
						})
				},
			})
		}
	}

	const onStartOver = () => {
		setSelectedFeedbackGivenAt(undefined)
	}

	const [feedbackResponse, setFeedbackResponse] = useState<{
		rawResponse: string
		synopsis: string
		commentary: string
		specificFeedback: string
		generalFeedback: string
	}>()

	const { mutate: registerFollowUp } = useZact(registerFollowUpAction)

	const { mutate: updateFeedbackSubmission } = useZact(
		updateFeedbackSubmissionAction
	)

	const onGetFollowUp = ({
		paragraph,
		sentence,
		followUps,
	}: {
		paragraph?: number
		sentence?: number
		followUps: string[]
	}) => {
		if (
			feedbackResponse &&
			selectedFeedbackGivenAt &&
			unrevisedSubmission
		) {
			const start = new Date()

			if (paragraph === undefined && sentence === undefined) {
				setGeneralFeedback(
					(generalFeedback) =>
						generalFeedback && {
							...generalFeedback,
							followUps,
							generating: true,
						}
				)
			} else {
				setSpecificFeedbackList(
					produce((specificFeedbackList) => {
						const specificFeedback = specificFeedbackList.find(
							(specificFeedback) =>
								specificFeedback.paragraph === paragraph &&
								specificFeedback.sentence === sentence
						)
						if (specificFeedback) {
							specificFeedback.followUps = followUps
							specificFeedback.generating = true
						}
					})
				)
			}

			let revision: { paragraph?: number; content: string } | undefined =
				undefined

			const revisedSubmission = submissionRef.current?.getText() ?? ""

			if (unrevisedSubmission?.trim() !== revisedSubmission.trim()) {
				updateFeedbackSubmission({
					courseId: assignment.courseId,
					assignmentId: assignment.assignmentId,
					feedbackGivenAt: selectedFeedbackGivenAt,
					submissionHTML: submissionRef.current?.getHTML() ?? "",
				})

				setUnrevisedSubmission(revisedSubmission)

				if (paragraph === undefined) {
					revision = { content: revisedSubmission }
				} else {
					const unrevisedParagraph = unrevisedSubmission
						.split("\n")
						.filter(
							(line) =>
								line.indexOf(".") !== -1 &&
								line.indexOf(".") !== line.lastIndexOf(".")
						)[paragraph - 1]

					const revisedParagraph = revisedSubmission
						.split("\n")
						.filter(
							(line) =>
								line.indexOf(".") !== -1 &&
								line.indexOf(".") !== line.lastIndexOf(".")
						)[paragraph - 1]

					if (
						unrevisedParagraph?.trim() !==
							revisedParagraph?.trim() &&
						revisedParagraph !== undefined
					) {
						revision = { paragraph, content: revisedParagraph }
					}
				}
			}

			getFollowup({
				feedback:
					paragraph === undefined && sentence === undefined
						? generalFeedback?.content ?? ""
						: specificFeedbackList.find(
								(specificFeedback) =>
									specificFeedback.paragraph === paragraph &&
									specificFeedback.sentence === sentence
						  )?.content ?? "",
				followUps,
				revision,
				instructions: assignment.instructions,
				submission: unrevisedSubmission ?? "",
				...feedbackResponse,
				onContent: (content) =>
					paragraph === undefined && sentence === undefined
						? setGeneralFeedback(
								produce((generalFeedback) => {
									if (!generalFeedback) return undefined

									if (
										generalFeedback.followUps.length % 2 ===
										1
									) {
										generalFeedback.followUps.push(content)
									} else {
										generalFeedback.followUps[
											generalFeedback.followUps.length - 1
										] = content
									}
								})
						  )
						: setSpecificFeedbackList(
								produce((specificFeedbackList) => {
									const specificFeedback =
										specificFeedbackList.find(
											(specificFeedback) =>
												specificFeedback.paragraph ===
													paragraph &&
												specificFeedback.sentence ===
													sentence
										)

									if (specificFeedback) {
										// relies on that user's followUps will be odd and gpt's will be even
										if (
											specificFeedback.followUps.length %
												2 ===
											1
										) {
											specificFeedback.followUps.push(
												content
											)
										} else {
											specificFeedback.followUps[
												specificFeedback.followUps
													.length - 1
											] = content
										}
									} else {
										console.error(
											"This shouldn't happen. followUp requested for specific feedback that doesn't exist"
										)
									}
								})
						  ),
				onFinish: ({
					messages,
					model,
					temperature,
					presencePenalty,
					frequencyPenalty,
				}) => {
					if (paragraph === undefined && sentence === undefined) {
						generalFeedback &&
							setGeneralFeedback(
								(generalFeedback) =>
									generalFeedback && {
										...generalFeedback,
										generating: false,
									}
							)
					} else {
						setSpecificFeedbackList(
							produce((specificFeedbackList) => {
								const specificFeedback =
									specificFeedbackList.find(
										(specificFeedback) =>
											specificFeedback.paragraph ===
												paragraph &&
											specificFeedback.sentence ===
												sentence
									)

								if (specificFeedback) {
									specificFeedback.generating = false
								}
							})
						)
					}

					registerFollowUp({
						courseId: assignment.courseId,
						assignmentId: assignment.assignmentId,
						feedbackGivenAt: selectedFeedbackGivenAt,
						paragraphNumber: paragraph,
						sentenceNumber: sentence,
						query: followUps.at(-1) ?? "",
						rawResponse: messages.at(-1)?.content ?? "",
						metadata: {
							model,
							temperature,
							presencePenalty,
							frequencyPenalty,
							messages,
							seconds:
								(new Date().valueOf() - start.valueOf()) / 1000,
						},
					})
				},
			})
		}
	}

	return (
		<>
			{submissions.length > 0 && (
				<Modal
					title="Pick a submission"
					open={modal === "submission"}
					setOpen={(open) =>
						open ? setModal("submission") : setModal(undefined)
					}
				>
					<div className="flex h-full flex-col justify-between">
						<SelectList
							items={submissions}
							selectionType="single"
							selectionSet={
								new Set(
									selectedAttachmentId
										? [selectedAttachmentId]
										: []
								)
							}
							setSelectionSet={(updater) => {
								if (typeof updater === "object") {
									setSelectedAttachmentId(
										updater.values().next().value
									)
								} else {
									setSelectedAttachmentId(
										updater(
											new Set(
												selectedAttachmentId
													? [selectedAttachmentId]
													: []
											)
										)
											.values()
											.next().value
									)
								}
							}}
							renderItem={({
								item: { title, id, thumbnailUrl, html, url },
								selected,
							}) => (
								<AttachmentItem
									name={title ?? ""}
									photo={thumbnailUrl}
									url={url}
									key={id}
									selected={selected}
								/>
							)}
							renderEmpty={() => null}
						/>

						<Button
							onClick={onPickAttachment}
							disabled={selectedAttachmentId === undefined}
							size="large"
						>
							Pick attachment
						</Button>
					</div>
				</Modal>
			)}

			<div className="relative flex h-full w-full overflow-y-scroll overscroll-y-contain rounded-md border border-border bg-white pt-16 shadow-lg shadow-[#00000016]">
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
									)

									if (!feedback) return

									feedback.state = update(feedback.state)
								})
							)
						}
					/>
				</div>

				<div className="relative flex h-fit basis-[704px] flex-col overflow-x-auto">
					<div ref={headerRef} className="min-h-12 flex flex-col">
						{feedbackHistory.length !== 0 && (
							<div
								ref={(div) =>
									div && (div.scrollLeft = div.scrollWidth)
								}
								className="mb-2.5 overflow-x-scroll"
							>
								<div className="flex w-max space-x-1.5">
									{feedbackHistory.map(
										({ givenAt }, index) => (
											<div
												onClick={() =>
													setSelectedFeedbackGivenAt(
														givenAt
													)
												}
												key={index}
												className={cn(
													"flex h-16 w-[304px] cursor-pointer items-center justify-between rounded-md border-[0.75px] border-border pl-6 pr-3.5 transition duration-150",
													givenAt.valueOf() ===
														selectedFeedbackGivenAt?.valueOf()
														? "bg-surface-selected hover:bg-surface-selected-hover"
														: "hover:bg-surface-hover"
												)}
											>
												<span className="font-medium opacity-80">
													{formatDate(givenAt)}
												</span>

												<button
													className="rounded-md border-border px-3 py-1.5 text-sm font-medium opacity-60 transition-all duration-150 hover:bg-surface-selected-hover hover:opacity-80"
													onClick={(e) => {
														e.stopPropagation()

														navigator.clipboard.writeText(
															`${
																window.location
																	.href
															}/${email}/${givenAt.valueOf()}`
														)

														setCopiedFeedbackLinkGivenAt(
															givenAt
														)
													}}
												>
													{givenAt.valueOf() ===
													copiedFeedbackLinkGivenAt?.valueOf()
														? "Link copied"
														: "Copy link"}
												</button>
											</div>
										)
									)}
								</div>
							</div>
						)}

						<div className="flex items-end justify-between">
							<div className="select-text text-2xl font-bold">
								{assignment.title}
							</div>

							{/* not sure why this is even necessary with justify-between */}
							<div className="flex-1" />

							<div className="flex-shrink-0">
								{generating ? (
									<Button disabled size="medium">
										{specificFeedbackList.length > 0
											? "Generating feedback..."
											: "Analyzing work..."}
									</Button>
								) : selectedFeedbackGivenAt === undefined ? (
									<div className="flex space-x-1.5">
										{submissions.length > 0 && (
											<Button
												onClick={() =>
													setModal("submission")
												}
												size="medium"
											>
												Import submission
											</Button>
										)}

										<Button
											onClick={onGetFeedback}
											disabled={submissionEmpty}
											size="medium"
										>
											Get feedback
										</Button>
									</div>
								) : (
									<div className="flex space-x-1.5">
										{submissions.length > 0 && (
											<Button
												onClick={() =>
													setModal("submission")
												}
												size="medium"
											>
												Import submission
											</Button>
										)}

										<Button
											onClick={onStartOver}
											size="medium"
										>
											Start over
										</Button>
									</div>
								)}
							</div>
						</div>

						{assignment.description !== undefined && (
							<p className="mt-3.5 mb-0.5 select-text text-sm opacity-60">
								{assignment.description}
							</p>
						)}
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
									)

									if (!feedback) return

									feedback.state = update(feedback.state)
								})
							)
						}
						ref={submissionRef}
					/>

					<AnimatePresence>
						{generalFeedback !== undefined && (
							<GeneralFeedback
								{...generalFeedback}
								onGetFollowUp={(followUps) =>
									onGetFollowUp({ followUps })
								}
								onStateChange={(update) =>
									setGeneralFeedback(
										(generalFeedback) =>
											generalFeedback && {
												...generalFeedback,
												state: update(
													generalFeedback.state
												),
											}
									)
								}
								submissionWidth={submissionWidth ?? 0}
							/>
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
									)

									if (!feedback) return

									feedback.state = update(feedback.state)
								})
							)
						}
					/>
				</div>
			</div>
		</>
	)
}

export default Feedback

const Submission = forwardRef<
	{
		getText: () => string | undefined
		getTextOffset: ({}: { paragraph: number }) => number
		getWidth: () => number | undefined
		getHTML: () => string
		setHTML: (html: string) => void
	},
	{
		editing: boolean
		onChangeEmpty: (empty: boolean) => void
		specificFeedbackList: {
			content: string
			paragraph: number
			sentence: number
			state: "focus" | "hover" | undefined
		}[]
		onSpecificFeedbackStateChange: ({}: {
			paragraph: number
			sentence: number
			update: (
				prevState: "focus" | "hover" | undefined
			) => "focus" | "hover" | undefined
		}) => void
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
		const ref = useRef<HTMLDivElement>(null)

		const [previousSpecificFeedbackList, setPreviousSpecificFeedbackList] =
			useState<typeof specificFeedbackList>()

		if (
			(previousSpecificFeedbackList?.length !==
				specificFeedbackList.length ||
				!specificFeedbackList
					.map(({ content }) => content)
					.join("")
					.startsWith(
						previousSpecificFeedbackList
							.map(({ content }) => content)
							.join("")
					)) &&
			ref.current !== null
		) {
			setPreviousSpecificFeedbackList(specificFeedbackList)

			for (const { paragraph, sentence } of specificFeedbackList) {
				const highlightId = getDomIdOfSpecificFeedbackHighlight({
					paragraph,
					sentence,
				})

				if (document.getElementById(highlightId) !== null) continue

				let currentParagraphNumber = 0

				for (const child of [
					...ref.current.querySelectorAll("p"),
					...ref.current.querySelectorAll("div"),
				]) {
					if (
						child.textContent !== null &&
						child.textContent.indexOf(".") !== -1 &&
						child.textContent.indexOf(".") !==
							child.textContent.lastIndexOf(".")
					) {
						currentParagraphNumber++
					}

					if (currentParagraphNumber !== paragraph) continue

					const precedingSpaces = (
						child.textContent?.match(/^\s+/g)?.[0] ?? ""
					).replaceAll(String.fromCharCode(160), "&nbsp;")

					const innerHTMLWithoutPrecedingSpaces =
						child.innerHTML.replace(precedingSpaces, "")

					child.innerHTML =
						precedingSpaces + innerHTMLWithoutPrecedingSpaces

					const segment =
						sentence === -1
							? innerHTMLWithoutPrecedingSpaces.trim()
							: breakIntoSentences(
									innerHTMLWithoutPrecedingSpaces
							  )[sentence - 1]?.trim()

					if (segment === undefined) {
						console.error(
							"This shouldn't happen. Segment wasn't able to be found within html"
						)

						break
					}

					const newParagraphHTML = child.innerHTML.replace(
						segment,
						renderToStaticMarkup(
							<span
								dangerouslySetInnerHTML={{ __html: segment }}
								id={highlightId}
								style={{
									...(child.style as unknown as CSSProperties),
									marginTop: -6,
									marginBottom: -6,
									marginLeft: -4,
									marginRight: -4,
									paddingTop: 6,
									paddingBottom: 6,
									paddingLeft: 4,
									paddingRight: 4,
									borderRadius: 6,
									backgroundColor: colors.surface,
									userSelect: "text",
								}}
								className="transition"
							/>
						)
					)

					child.innerHTML = newParagraphHTML

					break
				}
			}

			for (const { paragraph, sentence } of specificFeedbackList) {
				const highlightId = getDomIdOfSpecificFeedbackHighlight({
					paragraph,
					sentence,
				})

				const highlightSpan = document.getElementById(highlightId)

				if (highlightSpan === null) {
					console.error(
						"This shouldn't happen. Span corresponding to feedback element should be in DOM"
					)

					break
				}

				highlightSpan.addEventListener("click", () =>
					onSpecificFeedbackStateChange({
						paragraph,
						sentence,
						update: () => "focus",
					})
				)

				highlightSpan.addEventListener("pointerenter", () =>
					onSpecificFeedbackStateChange({
						paragraph,
						sentence,
						update: (prevState) =>
							prevState === "focus" ? "focus" : "hover",
					})
				)

				highlightSpan.addEventListener("pointerleave", () =>
					onSpecificFeedbackStateChange({
						paragraph,
						sentence,
						update: (prevState) =>
							prevState === "focus" ? "focus" : undefined,
					})
				)
			}
		}

		useEffect(() => {
			if (ref.current !== null) {
				const div = ref.current

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
								)
							} else {
								removeHighlightSpansFromChildren(child)
							}
						}
					}

					removeHighlightSpansFromChildren(div)
				} else {
					const addSelectTextToChildren = (element: Element) => {
						for (const child of element.children) {
							child.classList.add("select-text")

							addSelectTextToChildren(child)
						}
					}

					addSelectTextToChildren(div)
				}
			}
		}, [editing, specificFeedbackList])

		useEffect(() => {
			if (previousSpecificFeedbackList !== specificFeedbackList) {
				setPreviousSpecificFeedbackList(specificFeedbackList)

				for (const currentSpecificFeedback of specificFeedbackList) {
					const previousSpecificFeedback =
						previousSpecificFeedbackList?.find(
							(specificFeedback) =>
								specificFeedback.paragraph ===
									currentSpecificFeedback.paragraph &&
								specificFeedback.sentence ===
									currentSpecificFeedback.sentence
						)

					const highlightSpan = document.getElementById(
						getDomIdOfSpecificFeedbackHighlight({
							paragraph: currentSpecificFeedback.paragraph,
							sentence: currentSpecificFeedback.sentence,
						})
					)

					if (
						(previousSpecificFeedback === undefined ||
							previousSpecificFeedback.state !==
								currentSpecificFeedback.state) &&
						highlightSpan !== null
					) {
						switch (currentSpecificFeedback.state) {
							case "focus":
								highlightSpan.style.backgroundColor =
									colors["surface-selected-hover"]

								break

							case "hover":
								highlightSpan.style.backgroundColor =
									colors["surface-selected-hover"]

								break

							case undefined:
								highlightSpan.style.backgroundColor =
									colors["surface"]

								break
						}
					}
				}
			}
		}, [previousSpecificFeedbackList, specificFeedbackList])

		const [empty, setEmpty] = useState(true)

		useEffect(() => {
			if (ref.current) {
				const div = ref.current

				div.focus()

				const handler = () => {
					const empty =
						div.innerHTML === "" ||
						div.innerHTML === "<br>" ||
						div.innerHTML === "<div><br></div>"

					setEmpty(empty)

					onChangeEmpty(empty)
				}

				div.addEventListener("input", handler)

				return () => {
					div.removeEventListener("input", handler)
				}
			}
		}, [ref, onChangeEmpty])

		useImperativeHandle(
			forwardedRef,
			() => {
				return {
					getText: () => {
						if (ref.current === null) return ""

						const elementsText: string[] = []

						for (const element of ref.current.querySelectorAll(
							"p, div"
						)) {
							element.textContent &&
								elementsText.push(element.textContent)
						}

						return elementsText.join("\n")
					},
					getTextOffset: ({ paragraph }) => {
						let paragraphFound = false

						let offset = 0

						let currentParagraphNumber = 0

						if (ref.current !== null) {
							for (const child of ref.current.querySelectorAll(
								"p, div"
							)) {
								if (
									child.textContent?.indexOf(".") !==
									child.textContent?.lastIndexOf(".")
								) {
									currentParagraphNumber++
								}

								if (currentParagraphNumber === paragraph) {
									paragraphFound = true

									break
								}

								offset += child.clientHeight
							}
						}

						const textOffset = paragraphFound ? offset : 0

						return textOffset
					},
					getHTML: () => ref.current?.innerHTML ?? "",
					setHTML: (html) => {
						if (ref.current) {
							const empty =
								html === "" ||
								html === "<br>" ||
								html === "<div><br></div>"

							setEmpty(empty)

							onChangeEmpty(empty)

							ref.current.innerHTML = html
						}
					},
					getWidth: () => ref.current?.offsetWidth,
				}
			},
			[onChangeEmpty]
		)

		return (
			<div className="relative">
				<div
					contentEditable={editing}
					ref={ref}
					className="mb-[60vh] outline-none"
				/>

				{empty && (
					<span className="pointer-events-none absolute top-0 opacity-40">
						Your work goes here
					</span>
				)}
			</div>
		)
	}
)

Submission.displayName = "Submission"

function GeneralFeedback({
	content,
	generating,
	followUps,
	onGetFollowUp: onGetFollowUpProp,
	state,
	onStateChange,
	submissionWidth,
}: {
	content: string
	generating: boolean
	followUps: string[]
	onGetFollowUp: (followUps: string[]) => void
	state: "focus" | "hover" | undefined
	onStateChange: (
		update: (
			prevState: "focus" | "hover" | undefined
		) => "focus" | "hover" | undefined
	) => void
	submissionWidth: number
}) {
	const [followUpInput, setFollowUpInput] = useState("")

	const inputRef = useRef<HTMLTextAreaElement>(null)

	const scrollerRef = useRef<HTMLDivElement>(null)

	const { focusWithinProps } = useFocusWithin({
		onFocusWithinChange: (isFocusWithin) =>
			onStateChange((prevState) =>
				isFocusWithin
					? "focus"
					: isHovered || prevState === "hover"
					? "hover"
					: undefined
			),
	})

	const { hoverProps, isHovered } = useHover({
		onHoverChange: (isHovering) =>
			onStateChange((prevState) =>
				prevState === "focus"
					? "focus"
					: isHovering
					? "hover"
					: undefined
			),
	})

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
			})
		}
	}, [followUps])

	const [previousContent, setPreviousContent] = useState(content)

	useEffect(() => {
		if (
			scrollerRef.current !== null &&
			state !== undefined &&
			content !== previousContent &&
			Math.abs(
				scrollerRef.current.scrollHeight -
					scrollerRef.current.scrollTop -
					scrollerRef.current.clientHeight
			) < 50
		) {
			scrollerRef.current?.scroll({
				top: scrollerRef.current.scrollHeight,
			})

			setPreviousContent(content)
		}
	}, [content, state, previousContent])

	const onGetFollowUp = () => {
		if (generating) return

		onGetFollowUpProp([...followUps, followUpInput])

		setFollowUpInput("")

		scrollerRef.current?.scroll({
			top: scrollerRef.current.scrollHeight,
		})
	}

	useEffect(() => {
		if (state === "focus") inputRef.current?.focus()
	}, [state])

	return (
		content.length > 0 && (
			<div className="absolute">
				<motion.div
					onClick={() => {
						onStateChange(() => "focus")
					}}
					initial={{ opacity: 0, y: 25 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 25 }}
					transition={{
						duration: 0.35,
						ease: "easeOut",
					}}
					ref={scrollerRef}
					style={{
						width: submissionWidth + 8,
					}}
					className="fixed bottom-10 max-h-80 overflow-y-scroll overscroll-none rounded-md backdrop-blur-[6px]"
				>
					<div
						{...focusWithinProps}
						{...hoverProps}
						className={cn(
							"relative z-10 whitespace-pre-line rounded-md border border-border bg-surface opacity-80 shadow-sm",
							state === "focus" && "shadow-lg",
							state === "hover" && "shadow-lg"
						)}
					>
						<p className="select-text whitespace-pre-line px-4 py-2.5 font-medium opacity-80 [overflow-wrap:anywhere]">
							{content}
						</p>

						{followUps.map((followUp, index) => (
							<div
								key={index}
								className="border-t border-border px-4 py-2.5 odd:opacity-80 even:font-medium even:opacity-40"
							>
								<p className="select-text whitespace-pre-line">
									{followUp}
								</p>
							</div>
						))}

						<div
							style={{
								height:
									state === "focus" || state === "hover"
										? (inputRef.current?.offsetHeight ??
												0) + 9
										: 0,
							}}
							className={cn(
								"overflow-hidden rounded-b-md bg-surface-hover transition-all"
							)}
						>
							<div className="border-t border-border p-1">
								<TextArea
									value={followUpInput}
									setValue={setFollowUpInput}
									placeholder={
										generating
											? "Generating..."
											: "Say something"
									}
									onEnter={onGetFollowUp}
									ref={inputRef}
									autoComplete="off"
									className="py-2 px-3.5 text-lg opacity-80"
								/>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		)
	)
}

function SpecificFeedbackColumn({
	feedbackList,
	getSubmissionTextOffset,
	onGetFollowUp,
	onStateChange,
}: {
	feedbackList: {
		paragraph: number
		sentence: number
		content: string
		generating: boolean
		followUps: string[]
		state: "focus" | "hover" | undefined
	}[]
	getSubmissionTextOffset: ({}: { paragraph: number }) => number
	onGetFollowUp: ({}: {
		paragraph: number
		sentence: number
		followUps: string[]
	}) => void
	onStateChange: ({}: {
		paragraph: number
		sentence: number
		update: (
			prevState: "focus" | "hover" | undefined
		) => "focus" | "hover" | undefined
	}) => void
}) {
	feedbackList = feedbackList.sort(
		(feedback1, feedback2) =>
			feedback1.paragraph * 10 +
			feedback1.sentence -
			feedback2.paragraph * 10 -
			feedback2.sentence
	)

	const ref = useRef<HTMLDivElement>(null)

	const [tops, setTops] = useState<number[]>([])

	const [previousFeedbackList, setPreviousFeedbackList] =
		useState<typeof feedbackList>()

	if (
		previousFeedbackList?.length !== feedbackList.length ||
		!feedbackList
			.map(({ content }) => content)
			.join("")
			.startsWith(
				previousFeedbackList.map(({ content }) => content).join("")
			)
	) {
		setPreviousFeedbackList(feedbackList)

		const newTops = [] as number[]

		for (const feedback of feedbackList) {
			let top = getSubmissionTextOffset({
				paragraph: feedback.paragraph,
			})

			const previousTop = newTops.at(-1)

			if (
				previousTop !== undefined &&
				ref.current?.lastElementChild?.firstElementChild !== null
			) {
				const prevHeight =
					ref.current?.lastElementChild?.firstElementChild
						.scrollHeight

				top = Math.max(previousTop + (prevHeight ?? 0) + 8, top)
			}

			newTops.push(top)
		}

		setTops(newTops)
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
						style={{
							top: tops[index],
							zIndex:
								feedback.paragraph * 10 +
								feedback.sentence +
								(feedback.state === "focus"
									? 40
									: feedback.state === "hover"
									? 20
									: 0),
						}}
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
	)
}

SpecificFeedbackColumn.displayName = "SpecificFeedbackColumn"

function SpecificFeedbackItem({
	content,
	generating,
	followUps,
	onGetFollowUp: onGetFollowUpProp,
	state,
	onStateChange,
}: {
	content: string
	generating: boolean
	followUps: string[]
	onGetFollowUp: (followUps: string[]) => void
	state: "focus" | "hover" | undefined
	onStateChange: (
		update: (
			prevState: "focus" | "hover" | undefined
		) => "focus" | "hover" | undefined
	) => void
}) {
	const [followUpInput, setFollowUpInput] = useState("")

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
	})

	const { hoverProps, isHovered } = useHover({
		onHoverChange: (isHovering) =>
			onStateChange((prevState) =>
				prevState === "focus"
					? "focus"
					: isHovering
					? "hover"
					: undefined
			),
	})

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
			})
		}
	}, [followUps])

	const [previousContent, setPreviousContent] = useState(content)

	useEffect(() => {
		if (
			scrollerRef.current !== null &&
			state !== undefined &&
			content !== previousContent &&
			Math.abs(
				scrollerRef.current.scrollHeight -
					scrollerRef.current.scrollTop -
					scrollerRef.current.clientHeight
			) < 50
		) {
			scrollerRef.current?.scroll({
				top: scrollerRef.current.scrollHeight,
			})

			setPreviousContent(content)
		}
	}, [content, state, previousContent])

	const onGetFollowUp = () => {
		if (generating) return

		onGetFollowUpProp([...followUps, followUpInput])

		setFollowUpInput("")

		scrollerRef.current?.scroll({
			top: scrollerRef.current.scrollHeight,
		})
	}

	const scrollerRef = useRef<HTMLDivElement>(null)

	const inputRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (state === "focus") inputRef.current?.focus()
	}, [state])

	return (
		<div
			{...focusWithinProps}
			{...hoverProps}
			className={cn(
				"group absolute flex flex-col rounded-md border border-border bg-surface shadow-sm shadow-[#E5E5E5] transition-shadow duration-500",
				state === "focus" && "shadow-lg",
				state === "hover" && "shadow-lg"
			)}
		>
			<div
				ref={scrollerRef}
				onClick={() => {
					onStateChange(() => "focus")
				}}
				className="max-h-[300px] overflow-y-scroll overscroll-none"
			>
				<div className="px-3 py-2">
					<p className="select-text whitespace-pre-line opacity-80">
						{content}
					</p>
				</div>

				{followUps.map((followUp, index) => (
					// ok to use index as key because it functions as each followUp's id and shouldn't change
					// figure out if 1px or 0.75px border looks better
					<div
						key={index}
						className="border-t border-border px-3 py-2 odd:opacity-80 even:font-medium even:opacity-40"
					>
						<p className="select-text whitespace-pre-line opacity-80">
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
				className={cn(
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
						autoComplete="off"
						ref={inputRef}
						className="py-2 px-3.5 text-lg opacity-80"
					/>
				</div>
			</div>
		</div>
	)
}
