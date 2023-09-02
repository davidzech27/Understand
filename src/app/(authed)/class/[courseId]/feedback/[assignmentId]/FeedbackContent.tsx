import { useEffect, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"

import cn from "~/utils/cn"
import FeedbackCard from "./FeedbackCard"
import FeedbackSubmission from "./FeedbackSubmission"

type FeedbackState = "focus" | "hover" | undefined

type Props =
	| {
			submissionHTML: string
			onChangeSubmissionHTML: (html: string) => void
			feedbackList:
				| {
						paragraph?: number
						sentence?: number
						content: string
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
						state: FeedbackState
				  }[]
				| undefined
			feedbackInsights?: undefined
			generating: boolean
			editing: boolean
			onGetFollowUp: ({
				paragraph,
				sentence,
				input,
			}: {
				paragraph?: number
				sentence?: number
				input: string
			}) => void
			onChangeFeedbackState: ({
				paragraph,
				sentence,
				state,
			}: {
				paragraph?: number
				sentence?: number
				state:
					| FeedbackState
					| ((prevState: FeedbackState) => FeedbackState)
			}) => void
	  }
	| {
			submissionHTML: string
			onChangeSubmissionHTML?: undefined
			feedbackList:
				| {
						paragraph?: number
						sentence?: number
						content: string
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
						state: FeedbackState
				  }[]
				| undefined
			feedbackInsights?: undefined
			generating?: undefined
			editing?: undefined
			onGetFollowUp?: undefined
			onChangeFeedbackState: ({
				paragraph,
				sentence,
				state,
			}: {
				paragraph?: number
				sentence?: number
				state:
					| FeedbackState
					| ((prevState: FeedbackState) => FeedbackState)
			}) => void
	  }
	| {
			submissionHTML: string
			onChangeSubmissionHTML?: undefined
			feedbackList?: undefined
			feedbackInsights: {
				paragraphs: number[]
				content: string
				type: "strength" | "weakness"
				state: FeedbackState
			}[]
			generating?: undefined
			editing?: undefined
			onGetFollowUp?: undefined
			onChangeFeedbackState: ({
				paragraph,
				sentence,
				state,
			}: {
				paragraph?: number
				sentence?: number
				state:
					| FeedbackState
					| ((prevState: FeedbackState) => FeedbackState)
			}) => void
	  }

export default function FeedbackContent({
	submissionHTML,
	onChangeSubmissionHTML,
	feedbackList,
	feedbackInsights,
	generating,
	editing,
	onGetFollowUp,
	onChangeFeedbackState,
}: Props) {
	const [paragraphYOffsets, setParagraphYOffsets] = useState<
		{ paragraph: number; yOffset: number }[]
	>([])

	const specificFeedback = feedbackList
		?.map((feedbackItem) =>
			feedbackItem.paragraph !== undefined &&
			feedbackItem.sentence !== undefined
				? {
						paragraph: feedbackItem.paragraph,
						sentence: feedbackItem.sentence,
						...feedbackItem,
				  }
				: undefined
		)
		.filter(Boolean)

	const generalFeedback = feedbackList
		?.map((feedbackItem) =>
			feedbackItem.paragraph === undefined &&
			feedbackItem.sentence === undefined
				? {
						paragraph: feedbackItem.paragraph,
						sentence: feedbackItem.sentence,
						...feedbackItem,
				  }
				: undefined
		)
		.filter(Boolean)

	const specificInsights = feedbackInsights?.filter(
		(insight) => insight.paragraphs[0] !== -1
	)

	const generalInsights = feedbackInsights?.filter(
		(insight) => insight.paragraphs[0] === -1
	)

	const ref = useRef<HTMLDivElement>(null)

	const specificFeedbackColumnLeftRef = useRef<HTMLDivElement>(null)
	const specificFeedbackColumnRightRef = useRef<HTMLDivElement>(null)

	const [submissionWidth, setSubmissionWidth] = useState(0)

	useEffect(() => {
		if (
			ref.current !== null &&
			specificFeedbackColumnLeftRef.current !== null &&
			specificFeedbackColumnRightRef.current !== null
		)
			setSubmissionWidth(
				ref.current.clientWidth -
					specificFeedbackColumnLeftRef.current.clientWidth -
					specificFeedbackColumnRightRef.current.clientWidth
			)
	}, [])

	return (
		<div className="flex" ref={ref}>
			<div
				ref={specificFeedbackColumnLeftRef}
				className="relative min-w-[192px] flex-[0.75]"
			>
				<AnimatePresence>
					{(
						specificFeedback
							?.filter((_, index) => index % 2 === 1)
							.map(
								({
									paragraph,
									sentence,
									content,
									followUps,
									state,
								}) => ({
									paragraph,
									sentence,
									content,
									followUps,
									state,
								})
							) ??
						specificInsights
							?.filter((_, index) => index % 2 === 1)
							.map(({ paragraphs, content, state }) => ({
								paragraph: paragraphs[0] ?? 0,
								sentence: -1,
								content,
								followUps: [],
								state,
							}))
					)
						?.sort(
							(first, second) =>
								first.paragraph - second.paragraph
						)
						.map((feedback, index) => (
							<FeedbackCard
								content={feedback.content}
								followUps={feedback.followUps
									.map((followUp) => [
										followUp.userMessage,
										followUp.aiMessage,
									])
									.flat()
									.filter(Boolean)}
								input={
									onGetFollowUp && {
										show:
											feedback.state !== undefined &&
											onGetFollowUp !== undefined,
										focused: feedback.state === "focus",
										onSubmit: (input) =>
											onGetFollowUp?.({
												paragraph: feedback.paragraph,
												sentence: feedback.sentence,
												input,
											}),
										suggestedInputs: [
											"Why?",
											"Give an example",
											"I disagree",
										],
										placeholder: generating
											? "Generating..."
											: "Say something",
										disabled: generating,
									}
								}
								onChangeMouseState={({
									focusWithin,
									hover,
								}) => {
									onChangeFeedbackState({
										paragraph: feedback.paragraph,
										sentence: feedback.sentence,
										state: focusWithin
											? "focus"
											: hover
											? "hover"
											: undefined,
									})
								}}
								onClick={() =>
									onChangeFeedbackState({
										paragraph: feedback.paragraph,
										sentence: feedback.sentence,
										state: "focus",
									})
								}
								initial={{ opacity: 0, y: 10 }}
								animate={{
									opacity: 1,
									x:
										feedback.state === "focus"
											? (specificFeedbackColumnLeftRef
													.current?.clientWidth ??
													0) - 16
											: 0,
									y:
										feedback.state === "focus"
											? (paragraphYOffsets.find(
													({ paragraph }) =>
														paragraph ===
														feedback.paragraph + 1
											  )?.yOffset ?? 0) -
											  (paragraphYOffsets.find(
													({ paragraph }) =>
														paragraph ===
														feedback.paragraph
											  )?.yOffset ?? 0)
											: 0,
									width:
										feedback.state === "focus"
											? submissionWidth
											: "auto",
								}}
								exit={{ opacity: 0, y: 10 }}
								key={`${feedback.paragraph},${feedback.sentence}`}
								style={{
									top: (() => {
										const yOffset = paragraphYOffsets.find(
											({ paragraph }) =>
												paragraph === feedback.paragraph
										)?.yOffset

										const specificFeedbackColumn =
											specificFeedbackColumnLeftRef.current

										const previousCard =
											specificFeedbackColumn?.children &&
											[
												...specificFeedbackColumn.children,
											][index - 1]

										if (
											yOffset === undefined ||
											previousCard === undefined
										)
											return yOffset

										const alternativeYOffset =
											parseInt(
												previousCard
													.computedStyleMap()
													.get("top")
													?.toString() ?? "0"
											) +
											(previousCard.firstElementChild
												?.clientHeight ?? 0) +
											10

										if (isNaN(alternativeYOffset))
											return yOffset

										return Math.max(
											yOffset,
											alternativeYOffset
										)
									})(),
									zIndex:
										feedback.paragraph * 10 +
										feedback.sentence +
										(feedback.state === "focus"
											? 40
											: feedback.state === "hover"
											? 20
											: 0),
								}}
								className={cn(
									"absolute left-4 right-4 max-h-[400px]",
									feedback.state !== undefined && "shadow-lg"
								)}
							/>
						))}
				</AnimatePresence>
			</div>

			<div className="relative flex basis-[704px] flex-col">
				<FeedbackSubmission
					html={submissionHTML}
					onChangeHTML={onChangeSubmissionHTML ?? (() => {})}
					editing={editing ?? false}
					highlights={
						specificFeedback?.map(
							({ paragraph, sentence, state }) => ({
								paragraph,
								sentence,
								dark: state !== undefined,
							})
						) ??
						specificInsights
							?.map(({ paragraphs, state }) =>
								paragraphs.map((paragraph) => ({
									paragraph,
									sentence: -1,
									dark: state !== undefined,
								}))
							)
							.flat()
							.reduce<
								{
									paragraph: number
									sentence: number
									dark: boolean
								}[]
							>((prev, cur) => {
								const previousParagraphInsightIndex =
									prev.findIndex(
										({ paragraph }) =>
											paragraph === cur.paragraph
									)

								const previousParagraphInsight =
									prev[previousParagraphInsightIndex]

								if (
									previousParagraphInsightIndex === -1 ||
									previousParagraphInsight === undefined
								) {
									return prev.concat(cur)
								} else {
									return [
										...prev.slice(
											0,
											previousParagraphInsightIndex
										),
										{
											...previousParagraphInsight,
											dark:
												previousParagraphInsight.dark ||
												cur.dark,
										},
										...prev.slice(
											previousParagraphInsightIndex + 1
										),
									]
								}
							}, []) ??
						[]
					}
					onHoverHighlight={({ paragraph, sentence }) =>
						onChangeFeedbackState({
							paragraph,
							sentence,
							state: (prevState) =>
								prevState === "focus" ? "focus" : "hover",
						})
					}
					onUnhoverHighlight={({ paragraph, sentence }) =>
						onChangeFeedbackState({
							paragraph,
							sentence,
							state: (prevState) =>
								prevState === "focus" ? "focus" : undefined,
						})
					}
					onClickHighlight={({ paragraph, sentence }) =>
						onChangeFeedbackState({
							paragraph,
							sentence,
							state: "focus",
						})
					}
					onChangeParagraphYOffsets={setParagraphYOffsets}
				/>

				<AnimatePresence>
					{generalFeedback === undefined &&
					generalInsights === undefined ? (
						<div className="h-[60vh]" />
					) : (
						<div className="mt-4 mb-20 flex flex-col gap-2.5">
							{(
								generalFeedback?.map(
									({
										paragraph,
										sentence,
										content,
										followUps,
										state,
									}) => ({
										paragraph,
										sentence,
										content,
										followUps,
										state,
									})
								) ??
								generalInsights?.map(
									({ paragraphs, content, state }) => ({
										paragraph: paragraphs[0] ?? 0,
										sentence: -1,
										content,
										followUps: [],
										state,
									})
								)
							)?.map((feedbackItem, index) => (
								<FeedbackCard
									content={feedbackItem.content}
									followUps={feedbackItem.followUps
										.map((followUp) => [
											followUp.userMessage,
											followUp.aiMessage,
										])
										.flat()
										.filter(Boolean)}
									input={
										onGetFollowUp && {
											show:
												feedbackItem.state !==
													undefined &&
												onGetFollowUp !== undefined,
											focused:
												feedbackItem.state === "focus",
											onSubmit: (input) =>
												onGetFollowUp?.({
													input,
												}),
											suggestedInputs: [
												"Why?",
												"Give an example",
												"I disagree",
											],
											placeholder: generating
												? "Generating..."
												: "Say something",
											disabled: generating,
										}
									}
									onChangeMouseState={({
										focusWithin,
										hover,
									}) => {
										onChangeFeedbackState({
											state: focusWithin
												? "focus"
												: hover
												? "hover"
												: undefined,
										})
									}}
									onClick={() =>
										onChangeFeedbackState({
											state: "focus",
										})
									}
									initial={{ opacity: 0, y: 35 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 35 }}
									key={index}
									className={cn(
										"max-h-[85vh]",
										feedbackItem.state !== undefined &&
											"shadow-lg"
									)}
								/>
							))}
						</div>
					)}
				</AnimatePresence>
			</div>

			<div
				ref={specificFeedbackColumnRightRef}
				className="relative min-w-[192px] flex-1"
			>
				<AnimatePresence>
					{(
						specificFeedback
							?.filter((_, index) => index % 2 === 0)
							.map(
								({
									paragraph,
									sentence,
									content,
									followUps,
									state,
								}) => ({
									paragraph,
									sentence,
									content,
									followUps,
									state,
								})
							) ??
						specificInsights
							?.filter((_, index) => index % 2 === 0)
							.map(({ paragraphs, content, state }) => ({
								paragraph: paragraphs[0] ?? 0,
								sentence: -1,
								content,
								followUps: [],
								state,
							}))
					)
						?.sort(
							(first, second) =>
								first.paragraph - second.paragraph
						)
						.map((feedback, index) => (
							<FeedbackCard
								content={feedback.content}
								followUps={feedback.followUps
									.map((followUp) => [
										followUp.userMessage,
										followUp.aiMessage,
									])
									.flat()
									.filter(Boolean)}
								input={
									onGetFollowUp && {
										show: feedback.state !== undefined,
										focused: feedback.state === "focus",
										onSubmit: (input) =>
											onGetFollowUp?.({
												paragraph: feedback.paragraph,
												sentence: feedback.sentence,
												input,
											}),
										suggestedInputs: [
											"Why?",
											"Give an example",
											"I disagree",
										],
										placeholder: generating
											? "Generating..."
											: "Say something",
										disabled: generating,
									}
								}
								onChangeMouseState={({
									focusWithin,
									hover,
								}) => {
									onChangeFeedbackState({
										paragraph: feedback.paragraph,
										sentence: feedback.sentence,
										state: focusWithin
											? "focus"
											: hover
											? "hover"
											: undefined,
									})
								}}
								onClick={() =>
									onChangeFeedbackState({
										paragraph: feedback.paragraph,
										sentence: feedback.sentence,
										state: "focus",
									})
								}
								initial={{ opacity: 0, y: 10 }}
								animate={{
									opacity: 1,
									x:
										feedback.state === "focus"
											? `calc(-${submissionWidth}px - 16px)`
											: 0,
									y:
										feedback.state === "focus"
											? (paragraphYOffsets.find(
													({ paragraph }) =>
														paragraph ===
														feedback.paragraph + 1
											  )?.yOffset ?? 0) -
											  (paragraphYOffsets.find(
													({ paragraph }) =>
														paragraph ===
														feedback.paragraph
											  )?.yOffset ?? 0)
											: 0,
									width:
										feedback.state === "focus"
											? submissionWidth
											: "auto",
								}}
								exit={{ opacity: 0, y: 10 }}
								key={`${feedback.paragraph},${feedback.sentence}`}
								style={{
									top: (() => {
										const yOffset = paragraphYOffsets.find(
											({ paragraph }) =>
												paragraph === feedback.paragraph
										)?.yOffset

										const specificFeedbackColumn =
											specificFeedbackColumnRightRef.current

										const previousCard =
											specificFeedbackColumn?.children &&
											[
												...specificFeedbackColumn.children,
											][index - 1]

										if (
											yOffset === undefined ||
											previousCard === undefined
										)
											return yOffset

										const alternativeYOffset =
											parseInt(
												previousCard
													.computedStyleMap()
													.get("top")
													?.toString() ?? "0"
											) +
											(previousCard.firstElementChild
												?.clientHeight ?? 0) +
											10

										if (isNaN(alternativeYOffset))
											return yOffset

										return Math.max(
											yOffset,
											alternativeYOffset
										)
									})(),
									zIndex:
										feedback.paragraph * 10 +
										feedback.sentence +
										(feedback.state === "focus"
											? 40
											: feedback.state === "hover"
											? 20
											: 0),
								}}
								className={cn(
									"absolute left-4 right-4 max-h-[400px]",
									feedback.state !== undefined && "shadow-lg"
								)}
							/>
						))}
				</AnimatePresence>
			</div>
		</div>
	)
}
