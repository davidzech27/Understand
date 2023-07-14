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
import { motion } from "framer-motion"
import { useFocusWithin, useHover } from "react-aria"

import breakIntoSentences from "~/utils/breakIntoSentences"
import cn from "~/utils/cn"
import colors from "colors.cjs"

interface Props {
	assignment: {
		title: string
		description?: string
	}
	submissionHTML: string
	specificFeedbackList: {
		paragraph: number
		sentence: number
		content: string
		followUps: string[]
	}[]
	generalFeedback: {
		content: string
		followUps: string[]
	}
}

const specificFeedbackHighlightDomIdPrefix = "specific-feedback"

const getDomIdOfSpecificFeedbackHighlight = ({
	paragraph,
	sentence,
}: {
	paragraph: number
	sentence: number
}) => `${specificFeedbackHighlightDomIdPrefix}-${paragraph}-${sentence}`

export default function Feedback({
	assignment,
	submissionHTML,
	specificFeedbackList: specificFeedbackListProp,
	generalFeedback,
}: Props) {
	const submissionRef = useRef<{
		getText: () => string | undefined
		getTextOffset: ({}: { paragraph: number }) => number
		getWidth: () => number | undefined
		getHTML: () => string
		setHTML: (html: string) => void
	}>(null)

	const [specificFeedbackList, setSpecificFeedbackList] = useState<
		{
			paragraph: number
			sentence: number
			content: string
			followUps: string[]
			hover: boolean
		}[]
	>(
		specificFeedbackListProp.map((specificFeedback) => ({
			...specificFeedback,
			hover: false,
		}))
	)

	const [submissionWidth, setSubmissionWidth] = useState<number>()

	const headerRef = useRef<HTMLDivElement>(null)

	const [headerHeight, setHeaderHeight] = useState<number>()

	useEffect(() => {
		const positionContent = () => {
			if (submissionRef.current) {
				setSubmissionWidth(submissionRef.current.getWidth())
			}

			if (headerRef.current) {
				setHeaderHeight(headerRef.current.offsetHeight + 20)
			}
		}

		positionContent()

		window.addEventListener("resize", positionContent)

		submissionRef.current?.setHTML(submissionHTML)

		return () => {
			window.removeEventListener("resize", positionContent)
		}
	}, [submissionHTML])

	const [rendering, setRendering] = useState(false)

	useEffect(() => setRendering(true), [])

	return (
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
						submissionRef.current?.getTextOffset
					}
					onHoverChange={({ paragraph, sentence, update }) =>
						setSpecificFeedbackList(
							produce((feedbackList) => {
								const feedback = feedbackList.find(
									(feedback) =>
										feedback.paragraph === paragraph &&
										feedback.sentence === sentence
								)

								if (!feedback) return

								feedback.hover =
									typeof update === "function"
										? update(feedback.hover)
										: update
							})
						)
					}
				/>
			</div>

			<div
				className={cn(
					"relative flex basis-[704px] flex-col",
					!rendering && "opacity-0"
				)}
			>
				<div ref={headerRef} className="min-h-12 flex flex-col">
					<div className="flex items-end">
						<div className="select-text text-2xl font-bold">
							{assignment.title}
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
					specificFeedbackList={specificFeedbackList}
					onSpecificFeedbackHoverChange={({
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

								feedback.hover =
									typeof update === "function"
										? update(feedback.hover)
										: update
							})
						)
					}
					ref={submissionRef}
				/>

				<GeneralFeedback
					{...generalFeedback}
					submissionWidth={submissionWidth ?? 0}
				/>
			</div>

			<div style={{ marginTop: headerHeight ?? 0 }} className="flex-1">
				<SpecificFeedbackColumn
					feedbackList={specificFeedbackList.filter(
						(_, index) => index % 2 === 0
					)}
					getSubmissionTextOffset={
						submissionRef.current?.getTextOffset
					}
					onHoverChange={({ paragraph, sentence, update }) => {
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

								if (specificFeedback !== undefined) {
									specificFeedback.hover =
										typeof update === "function"
											? update(specificFeedback.hover)
											: update
								}
							})
						)
					}}
				/>
			</div>
		</div>
	)
}

const Submission = forwardRef<
	{
		getText: () => string | undefined
		getTextOffset: ({}: { paragraph: number }) => number
		getWidth: () => number | undefined
		getHTML: () => string
		setHTML: (html: string) => void
	},
	{
		specificFeedbackList: {
			paragraph: number
			sentence: number
			hover: boolean
		}[]
		onSpecificFeedbackHoverChange: ({}: {
			paragraph: number
			sentence: number
			update: ((prevHover: boolean) => boolean) | boolean
		}) => void
	}
>(({ specificFeedbackList, onSpecificFeedbackHoverChange }, forwardedRef) => {
	const ref = useRef<HTMLDivElement>(null)

	const [
		previousSpecificFeedbackListLength,
		setPreviousSpecificFeedbackListLength,
	] = useState(0)

	if (
		previousSpecificFeedbackListLength !== specificFeedbackList.length &&
		ref.current !== null
	) {
		setPreviousSpecificFeedbackListLength(specificFeedbackList.length)

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

				const innerHTMLWithoutPrecedingSpaces = child.innerHTML.replace(
					precedingSpaces,
					""
				)

				child.innerHTML =
					precedingSpaces + innerHTMLWithoutPrecedingSpaces

				const segment =
					sentence === -1
						? innerHTMLWithoutPrecedingSpaces.trim()
						: breakIntoSentences(innerHTMLWithoutPrecedingSpaces)[
								sentence - 1
						  ]?.trim()

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
			// for some weird reason, this doesn't always work when included in the above loop
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

				highlightSpan.addEventListener("pointerenter", () =>
					onSpecificFeedbackHoverChange({
						paragraph,
						sentence,
						update: true,
					})
				)

				highlightSpan.addEventListener("pointerleave", () =>
					onSpecificFeedbackHoverChange({
						paragraph,
						sentence,
						update: false,
					})
				)
			}
		}
	}

	const [previousSpecificFeedbackList, setPreviousSpecificFeedbackList] =
		useState(specificFeedbackList)

	useEffect(() => {
		if (previousSpecificFeedbackList !== specificFeedbackList) {
			setPreviousSpecificFeedbackList(specificFeedbackList)

			for (const currentSpecificFeedback of specificFeedbackList) {
				const previousSpecificFeedback =
					previousSpecificFeedbackList.find(
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
					previousSpecificFeedback !== undefined &&
					previousSpecificFeedback.hover !==
						currentSpecificFeedback.hover &&
					highlightSpan !== null
				) {
					if (currentSpecificFeedback.hover) {
						highlightSpan.style.backgroundColor =
							colors["surface-selected-hover"]
					} else {
						highlightSpan.style.backgroundColor = colors["surface"]
					}
				}
			}
		}
	}, [previousSpecificFeedbackList, specificFeedbackList])

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
						ref.current.innerHTML = html
					}
				},
				getWidth: () => ref.current?.offsetWidth,
			}
		},
		[]
	)

	return (
		<>
			<div ref={ref} className="outline-none" />

			<div>
				<div className="h-[60vh]"></div>
			</div>
		</>
	)
})

Submission.displayName = "Submission"

function GeneralFeedback({
	content,
	followUps,
	submissionWidth,
}: {
	content: string
	followUps: string[]
	submissionWidth: number
}) {
	return (
		content.length > 0 && (
			<div className="absolute">
				<motion.div
					initial={{ opacity: 0, y: 25 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						duration: 0.35,
						ease: "easeOut",
					}}
					style={{
						width: submissionWidth + 8,
					}}
					className="fixed bottom-10 max-h-80 overflow-y-scroll overscroll-none rounded-md backdrop-blur-[6px]"
				>
					<div className="relative z-10 whitespace-pre-line rounded-md border border-border bg-surface opacity-80 shadow-sm">
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
					</div>
				</motion.div>
			</div>
		)
	)
}

function SpecificFeedbackColumn({
	feedbackList,
	getSubmissionTextOffset,
	onHoverChange,
}: {
	feedbackList: {
		paragraph: number
		sentence: number
		content: string
		followUps: string[]
		hover: boolean
	}[]
	getSubmissionTextOffset?: ({}: { paragraph: number }) => number
	onHoverChange: ({}: {
		paragraph: number
		sentence: number
		update: ((prevHover: boolean) => boolean) | boolean
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

	const [tops, setTops] = useState<number[]>()

	useEffect(() => {
		if (tops === undefined && getSubmissionTextOffset !== undefined) {
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
	}, [feedbackList, getSubmissionTextOffset, tops])

	return (
		<div ref={ref} className="relative min-w-[192px]">
			{feedbackList.map(
				(feedback, index) =>
					tops !== undefined && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
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
									(feedback.hover ? 40 : 0),
							}}
							className="absolute left-4 right-4"
						>
							<SpecificFeedbackItem
								content={feedback.content}
								followUps={feedback.followUps}
								hover={feedback.hover}
								onHoverChange={(update) =>
									onHoverChange({
										paragraph: feedback.paragraph,
										sentence: feedback.sentence,
										update: (prevHover) =>
											typeof update === "function"
												? update(prevHover)
												: update,
									})
								}
							/>
						</motion.div>
					)
			)}
		</div>
	)
}

function SpecificFeedbackItem({
	content,
	followUps,
	hover,
	onHoverChange,
}: {
	content: string
	followUps: string[]
	hover: boolean
	onHoverChange: (update: ((prevHover: boolean) => boolean) | boolean) => void
}) {
	const { focusWithinProps } = useFocusWithin({
		onFocusWithinChange: (isFocusWithin) =>
			onHoverChange(isFocusWithin || isHovered),
	})

	const { hoverProps, isHovered } = useHover({
		onHoverChange: (isHovering) => onHoverChange(isHovering),
	})

	return (
		<div
			{...focusWithinProps}
			{...hoverProps}
			className={cn(
				"group absolute flex flex-col rounded-md border border-border bg-surface shadow-sm shadow-[#E5E5E5] transition-shadow duration-500",
				hover && "shadow-lg"
			)}
		>
			<div className="max-h-[300px] overflow-y-scroll overscroll-none">
				<div className="px-3 py-2">
					<p className="select-text whitespace-pre-line opacity-80">
						{content}
					</p>
				</div>

				{followUps.map((followUp, index) => (
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
		</div>
	)
}
