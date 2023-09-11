"use client"
import {
	useEffect,
	useRef,
	useState,
	experimental_useEffectEvent as useEffectEvent,
} from "react"
import { useLogger } from "next-axiom"
import { produce } from "immer"

import { type Feedback } from "~/data/Feedback"
import { type Assignment } from "~/data/Assignment"
import { type User } from "~/data/User"
import registerFeedbackAction from "./registerFeedbackAction"
import registerFollowUpAction from "./registerFollowUpAction"
import registerInsightsAction from "./registerInsightsAction"
import updateFeedbackSubmissionAction from "./updateFeedbackSubmissionAction"
import diffParagraph from "~/utils/diffParagraph"
import applyParagraphDiff from "~/utils/applyParagraphDiff"
import getFeedback from "~/ai/getFeedback"
import getFollowup from "~/ai/getFollowup"
import getInsights from "~/ai/getInsights"
import LinkedSubmissionModal from "./LinkedSubmissionModal"
import ShareModal from "./ShareModal"
import FeedbackHistory from "./FeedbackHistory"
import FeedbackHeader from "./FeedbackHeader"
import FeedbackContent from "./FeedbackContent"
import Button from "~/components/Button"
import Card from "~/components/Card"
import FeatureBlockModal from "~/limits/FeatureBlockModal"
import RateLimitModal from "~/limits/RateLimitModal"

interface Props {
	assignment: Assignment & { instructions: string }
	user: User
	role: "teacher" | "student"
	feedbackHistory: Feedback[]
	linkedSubmissions: {
		id: string
		title?: string
		url: string
		thumbnailUrl?: string
		htmlPromise: Promise<string>
	}[]
}

function removeTailwindFromHTML(html: string) {
	const dom = new DOMParser().parseFromString(html, "text/html").body

	const removeTailwindFromChildren = (element: Element) => {
		element.removeAttribute("class")

		element.setAttribute(
			"style",
			element
				.getAttribute("style")
				?.split(";")
				.filter((style) => !style.includes("--tw"))
				.join(";") ?? ""
		)

		for (const child of element.children) {
			removeTailwindFromChildren(child)
		}
	}

	removeTailwindFromChildren(dom)

	return dom.outerHTML
}

function htmlToText(html: string) {
	const dom = new DOMParser().parseFromString(html, "text/html").body

	const lines: string[] = []

	for (const element of dom.querySelectorAll("p, div")) {
		element.textContent && lines.push(element.textContent)
	}

	return lines.join("\n")
}

export default function Feedback({
	assignment,
	user,
	role,
	feedbackHistory: initialFeedbackHistory,
	linkedSubmissions,
}: Props) {
	const [feedbackHistory, setFeedbackHistory] = useState(
		initialFeedbackHistory
	)

	const [linkedSubmissionModalOpen, setLinkedSubmissionModalOpen] =
		useState(false)

	const onPickLinkedSubmission = async ({ id }: { id: string }) => {
		const pickedLinkedSubmission = linkedSubmissions.find(
			(linkedSubmission) => linkedSubmission.id === id
		)

		const pickedHTML = await pickedLinkedSubmission?.htmlPromise

		pickedHTML &&
			setFeedback((feedback) => ({
				...feedback,
				submissionHTML: pickedHTML,
			}))
	}

	type FeedbackState = "focus" | "hover" | undefined

	const [feedback, setFeedback] = useState<{
		givenAt?: Date
		submissionHTML: string
		unrevisedSubmissionHTML: string
		list: {
			followUps: {
				userMessage: string
				revisions: {
					paragraph: number
					sentence: number
					oldContent: string
					newContent: string
				}[]
				aiMessage: string
				sentAt: Date
			}[]
			paragraph?: number
			sentence?: number
			content: string
			state: FeedbackState
		}[]
		rawResponse?: string
		shared: boolean
	}>({
		submissionHTML: "",
		unrevisedSubmissionHTML: "",
		list: [],
		shared: false,
	})

	const feedbackRef = useRef<typeof feedback>({
		submissionHTML: "",
		unrevisedSubmissionHTML: "",
		list: [],
		shared: false,
	})

	useEffect(() => {
		feedbackRef.current = feedback
	}, [feedback])

	const onSelectFeedback = (feedback: (typeof feedbackHistory)[0]) => {
		setFeedback({
			...feedback,
			list: feedback.list.map((feedback) => ({
				...feedback,
				state: undefined,
			})),
		})

		setEditing(false)

		setGenerating(false)
	}

	const [editing, setEditing] = useState(true)

	const updateFeedbackSubmission = useEffectEvent(() => {
		if (feedback.givenAt)
			updateFeedbackSubmissionAction({
				courseId: assignment.courseId,
				assignmentId: assignment.assignmentId,
				givenAt: feedback.givenAt,
				submissionHTML: removeTailwindFromHTML(feedback.submissionHTML),
			})
	})

	useEffect(() => {
		if (!editing) updateFeedbackSubmission()
	}, [editing])

	const [generating, setGenerating] = useState(false)

	const [stopGenerating, setStopGenerating] = useState(() => () => {})

	const [featureBlockModalOpen, setFeatureBlockModalOpen] = useState(false)

	const [rateLimitModalOpen, setRateLimitModalOpen] = useState(false)

	const log = useLogger()

	const onGetFeedback = () => {
		if (
			user.schoolDistrictName === undefined ||
			user.schoolName === undefined
		)
			return setFeatureBlockModalOpen(true)

		setGenerating(true)

		setEditing(false)

		const submissionHTML = removeTailwindFromHTML(feedback.submissionHTML)

		const submissionText = htmlToText(submissionHTML)

		const { stop } = getFeedback({
			assignmentTitle: assignment.title,
			assignmentInstructions: assignment.instructions,
			studentName: user.name,
			submissionText,
			onContent: ({ content, paragraph, sentence }) => {
				setFeedback(
					produce((feedback) => {
						const feedbackItem = feedback.list.find(
							(feedback) =>
								feedback.paragraph === paragraph &&
								feedback.sentence === sentence
						)

						if (feedbackItem) {
							feedbackItem.content = content
						} else {
							feedback.list.push({
								paragraph,
								sentence,
								content,
								followUps: [],
								state: undefined,
							})
						}
					})
				)
			},
			onFinish: async ({ rawResponse }) => {
				setGenerating(false)

				let feedback = feedbackRef.current

				const { givenAt } = await registerFeedbackAction({
					courseId: assignment.courseId,
					assignmentId: assignment.assignmentId,
					submissionHTML,
					list: feedback.list,
					rawResponse,
				})

				feedback = feedbackRef.current

				const newFeedback = {
					...feedback,
					givenAt,
					rawResponse,
					unrevisedSubmissionHTML: submissionHTML,
				}

				setFeedback(newFeedback)

				setFeedbackHistory((feedbackHistory) => [
					...feedbackHistory,
					newFeedback,
				])

				if (role === "student") {
					const { insights } = await getInsights({
						feedback: newFeedback,
						assignmentTitle: assignment.title,
						assignmentInstructions: assignment.instructions,
						studentName: user.name,
						submissionText,
						onRateLimit: () => {},
						onError: (error) => {
							log.error("Insights error", { error })
						},
					})

					feedback = feedbackRef.current

					registerInsightsAction({
						courseId: assignment.courseId,
						assignmentId: assignment.assignmentId,
						givenAt,
						insights,
					})
				}
			},
			onRateLimit: () => {
				setGenerating(false)

				setRateLimitModalOpen(true)
			},
			onError: (error) => {
				log.error("Feedback error", { error })
			},
		})

		setStopGenerating(() => stop)
	}

	const [shareModalOpen, setShareModalOpen] = useState(false)

	const onShare = () => {
		setShareModalOpen(true)
	}

	const onStartOver = () => {
		setFeedback({
			submissionHTML: "",
			unrevisedSubmissionHTML: "",
			list: [],
			shared: false,
		})

		setEditing(true)
	}

	const onRevise = () => setEditing(true)

	const onDone = () => setEditing(false)

	const onGetFollowUp = ({
		paragraph,
		sentence,
		input,
	}: {
		paragraph?: number
		sentence?: number
		input: string
	}) => {
		const unrevisedSubmissionText = htmlToText(
			feedback.unrevisedSubmissionHTML
		)
		const revisedSubmissionText = htmlToText(feedback.submissionHTML)

		const unrevisedParagraphs = unrevisedSubmissionText
			.split("\n")
			.filter(
				(line) =>
					line.indexOf(".") !== -1 &&
					line.indexOf(".") !== line.lastIndexOf(".")
			)
		const revisedParagraphs = revisedSubmissionText
			.split("\n")
			.filter(
				(line) =>
					line.indexOf(".") !== -1 &&
					line.indexOf(".") !== line.lastIndexOf(".")
			)

		const revisions: {
			paragraph: number
			sentence: number
			oldContent: string
			newContent: string
		}[] = []

		if (paragraph !== undefined && sentence !== undefined) {
			const unrevisedParagraph = unrevisedParagraphs[paragraph - 1]
			const revisedParagraph = revisedParagraphs[paragraph - 1]

			if (
				unrevisedParagraph === undefined ||
				revisedParagraph === undefined
			)
				return

			let preLastRevisionParagraph = unrevisedParagraph

			feedback.list
				.find(
					(feedbackItem) =>
						feedbackItem.paragraph === paragraph &&
						feedbackItem.sentence === sentence
				)
				?.followUps.forEach(({ revisions }) =>
					revisions.forEach((revision) => {
						preLastRevisionParagraph = applyParagraphDiff(
							preLastRevisionParagraph,
							revision
						)
					})
				)

			const paragraphDiff = diffParagraph(
				preLastRevisionParagraph,
				revisedParagraph
			)

			if (paragraphDiff !== undefined)
				revisions.push({ paragraph, ...paragraphDiff })
		} else {
			unrevisedParagraphs.forEach(
				(unrevisedParagraph, paragraphIndex) => {
					const paragraph = paragraphIndex + 1

					const revisedParagraph = revisedParagraphs[paragraphIndex]

					if (revisedParagraph === undefined) return

					let preLastRevisionParagraph = unrevisedParagraph

					feedback.list
						.find(
							(feedbackItem) =>
								feedbackItem.paragraph === undefined &&
								feedbackItem.sentence === undefined
						)
						?.followUps.forEach(({ revisions }) =>
							revisions.forEach((revision) => {
								if (revision.paragraph === paragraph)
									preLastRevisionParagraph =
										applyParagraphDiff(
											preLastRevisionParagraph,
											revision
										)
							})
						)

					const paragraphDiff = diffParagraph(
						preLastRevisionParagraph,
						revisedParagraph
					)

					if (paragraphDiff !== undefined)
						revisions.push({
							paragraph,
							...paragraphDiff,
						})
				}
			)
		}

		if (
			feedback.givenAt === undefined ||
			feedback.rawResponse === undefined
		)
			return

		const newFeedback = {
			givenAt: feedback.givenAt,
			rawResponse: feedback.rawResponse,
			...produce<typeof feedback>((feedback) => {
				feedback.list
					.find(
						(feedbackItem) =>
							feedbackItem.paragraph === paragraph &&
							feedbackItem.sentence === sentence
					)
					?.followUps.push({
						userMessage: input,
						revisions,
						aiMessage: "",
						sentAt: new Date(),
					})
			})(feedback),
		}

		setFeedback(newFeedback)

		setEditing(false)

		setGenerating(true)

		const { stop } = getFollowup({
			paragraph,
			sentence,
			feedback: newFeedback,
			assignmentTitle: assignment.title,
			assignmentInstructions: assignment.instructions,
			studentName: user.name,
			unrevisedSubmissionText,
			onContent: (content) =>
				setFeedback(
					produce((feedback) => {
						const lastFollowUp = feedback.list
							.find(
								(feedbackItem) =>
									feedbackItem.paragraph === paragraph &&
									feedbackItem.sentence === sentence
							)
							?.followUps.at(-1)

						if (lastFollowUp) lastFollowUp.aiMessage = content
					})
				),
			onFinish: () => {
				setGenerating(false)

				const lastFollowUp = feedbackRef.current.list
					.find(
						(feedbackItem) =>
							feedbackItem.paragraph === paragraph &&
							feedbackItem.sentence === sentence
					)
					?.followUps.at(-1)

				if (feedback.givenAt && lastFollowUp) {
					registerFollowUpAction({
						courseId: assignment.courseId,
						assignmentId: assignment.assignmentId,
						feedbackGivenAt: feedback.givenAt,
						paragraph,
						sentence,
						followUp: lastFollowUp,
					})
				}
			},
			onRateLimit: () => {
				setGenerating(false)

				setRateLimitModalOpen(true)
			},
			onError: (error) => {
				log.error("Follow-up error", { error })
			},
		})

		setStopGenerating(() => stop)
	}

	return (
		<>
			<LinkedSubmissionModal
				open={linkedSubmissionModalOpen}
				setOpen={setLinkedSubmissionModalOpen}
				linkedSubmissions={linkedSubmissions}
				onPick={onPickLinkedSubmission}
			/>

			{feedback.givenAt !== undefined && (
				<ShareModal
					open={shareModalOpen}
					setOpen={setShareModalOpen}
					shared={feedback.shared}
					onChangeShared={(shared) => {
						setFeedback((prevFeedback) => ({
							...prevFeedback,
							shared,
						}))
					}}
					courseId={assignment.courseId}
					assignmentId={assignment.assignmentId}
					email={user.email}
					feedbackGivenAt={feedback.givenAt}
				/>
			)}

			<FeatureBlockModal
				open={featureBlockModalOpen}
				setOpen={setFeatureBlockModalOpen}
				feature="get feedback on your work"
			/>

			<RateLimitModal
				open={rateLimitModalOpen}
				setOpen={setRateLimitModalOpen}
			/>

			<Card className="relative h-full bg-white pt-16">
				<div className="h-full w-full overflow-x-hidden overflow-y-scroll">
					<div className="flex">
						<div className="min-w-[192px] flex-[0.75]" />

						<div className="max-w-[704px] basis-[704px]">
							<div className="min-h-12 flex flex-col">
								{feedbackHistory.length !== 0 && (
									<>
										<FeedbackHistory
											feedbackHistory={feedbackHistory}
											selectedFeedback={
												feedback.givenAt !==
													undefined &&
												feedback.rawResponse
													? {
															...feedback,
															givenAt:
																feedback.givenAt,
															rawResponse:
																feedback.rawResponse,
													  }
													: undefined
											}
											onSelectFeedback={onSelectFeedback}
										/>

										<div className="h-4" />
									</>
								)}

								<FeedbackHeader
									assignment={assignment}
									buttons={
										generating ? (
											<Button disabled size="medium">
												{feedback === undefined ||
												feedback.list.length === 0
													? "Analyzing work..."
													: "Generating feedback..."}
											</Button>
										) : feedback.givenAt === undefined ? (
											<>
												{linkedSubmissions.length >
													0 && (
													<Button
														onClick={() =>
															setLinkedSubmissionModalOpen(
																true
															)
														}
														size="medium"
													>
														Import submission
													</Button>
												)}

												<Button
													onClick={onGetFeedback}
													disabled={
														feedback.submissionHTML ===
														""
													}
													size="medium"
												>
													Get feedback
												</Button>
											</>
										) : (
											<>
												{linkedSubmissions.length >
													0 && (
													<Button
														onClick={() =>
															setLinkedSubmissionModalOpen(
																true
															)
														}
														size="medium"
													>
														Import submission
													</Button>
												)}

												<Button
													onClick={onShare}
													size="medium"
												>
													Share
												</Button>

												<Button
													onClick={onStartOver}
													size="medium"
												>
													Start over
												</Button>

												{!editing ? (
													<Button
														onClick={onRevise}
														size="medium"
													>
														Revise
													</Button>
												) : (
													<Button
														onClick={onDone}
														size="medium"
													>
														Done
													</Button>
												)}
											</>
										)
									}
								/>
							</div>

							<hr className="mb-3 mt-2" />
						</div>

						<div className="min-w-[192px] flex-1" />
					</div>

					<FeedbackContent
						submissionHTML={feedback.submissionHTML}
						onChangeSubmissionHTML={(submissionHTML) =>
							setFeedback((feedback) => ({
								...feedback,
								submissionHTML,
							}))
						}
						feedbackList={feedback.list}
						editing={editing}
						generating={generating}
						stopGenerating={stopGenerating}
						onGetFollowUp={onGetFollowUp}
						onChangeFeedbackState={({
							paragraph,
							sentence,
							state,
						}) =>
							setFeedback(
								produce((prevFeedback) => {
									if (prevFeedback === undefined) return

									const changedFeedback =
										prevFeedback.list.find(
											(feedbackItem) =>
												feedbackItem.paragraph ===
													paragraph &&
												feedbackItem.sentence ===
													sentence
										)

									if (changedFeedback)
										changedFeedback.state =
											typeof state === "function"
												? state(changedFeedback.state)
												: state
								})
							)
						}
					/>
				</div>
			</Card>
		</>
	)
}
