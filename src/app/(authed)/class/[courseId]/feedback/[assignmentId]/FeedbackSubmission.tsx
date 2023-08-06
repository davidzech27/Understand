import {
	useRef,
	useEffect,
	useState,
	experimental_useEffectEvent as useEffectEvent,
	type CSSProperties,
} from "react"
import { renderToStaticMarkup } from "react-dom/server"

import splitSentences from "~/utils/splitSentences"
import colors from "colors.cjs"

interface Props {
	html: string
	onChangeHTML: (html: string) => void
	editing: boolean
	highlights: {
		paragraph: number
		sentence: number
		dark: boolean
	}[]
	onHoverHighlight: ({
		paragraph,
		sentence,
	}: {
		paragraph: number
		sentence: number
	}) => void
	onUnhoverHighlight: ({
		paragraph,
		sentence,
	}: {
		paragraph: number
		sentence: number
	}) => void
	onClickHighlight: ({
		paragraph,
		sentence,
	}: {
		paragraph: number
		sentence: number
	}) => void
	onChangeParagraphYOffsets: (
		paragraphYOffsets: { paragraph: number; yOffset: number }[]
	) => void
}

const highlightIdPrefix = "specific-feedback"

const getHighlightId = ({
	paragraph,
	sentence,
}: {
	paragraph: number
	sentence: number
}) => `${highlightIdPrefix}-${paragraph}-${sentence}`

const addSelectTextToChildren = (element: Element) => {
	element.classList.add("select-text")

	for (const child of element.children) {
		addSelectTextToChildren(child)
	}
}

const removeSelectTextFromChildren = (element: Element) => {
	element.classList.remove("select-text")

	for (const child of element.children) {
		removeSelectTextFromChildren(child)
	}
}

const removeHighlightSpansFromChildren = (element: Element) => {
	for (const child of element.children) {
		if (child.id.startsWith(highlightIdPrefix)) {
			element.innerHTML = element.innerHTML.replace(
				child.outerHTML,
				child.innerHTML
			)
		}

		removeHighlightSpansFromChildren(child)
	}
}

export default function FeedbackSubmission({
	html: htmlProp,
	onChangeHTML,
	editing,
	highlights,
	onHoverHighlight,
	onUnhoverHighlight,
	onClickHighlight,
	onChangeParagraphYOffsets,
}: Props) {
	const ref = useRef<HTMLDivElement>(null)

	const addHighlights = useEffectEvent(() => {
		if (ref.current !== null) {
			for (const { paragraph, sentence } of highlights) {
				const highlightId = getHighlightId({
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
							: splitSentences(innerHTMLWithoutPrecedingSpaces)[
									sentence - 1
							  ]?.trim()

					if (segment === undefined) {
						// not ideal but bound to happen with revisions

						break
					}

					let inlineStyleLineHeight: number | undefined = Number(
						child
							.getAttribute("style")
							?.match(
								/(?<=line-height:\s*)(\d|\.)+(?=\s*;)/g
							)?.[0]
					)

					if (isNaN(inlineStyleLineHeight))
						inlineStyleLineHeight = undefined

					const ySpace =
						inlineStyleLineHeight === undefined ||
						(inlineStyleLineHeight > 1.2 &&
							inlineStyleLineHeight < 1.8)
							? 1
							: inlineStyleLineHeight <= 1.2
							? 0
							: inlineStyleLineHeight < 2.4
							? 3
							: 6

					const newParagraphHTML = child.innerHTML.replace(
						segment,
						renderToStaticMarkup(
							<span
								dangerouslySetInnerHTML={{ __html: segment }}
								id={highlightId}
								style={{
									...(child.style as unknown as CSSProperties),
									borderRadius: 6,
									paddingLeft: 4,
									paddingRight: 4,
									marginLeft: -4,
									marginRight: -4,
									paddingTop: ySpace,
									paddingBottom: ySpace,
									marginTop: -1 * ySpace,
									marginBottom: -1 * ySpace,
									backgroundColor: colors.surface,
									userSelect: "text",
									zIndex: sentence === -1 ? 0 : 10,
								}}
								className="transition"
							/>
						)
					)

					child.innerHTML = newParagraphHTML

					break
				}
			}

			process.nextTick(() => {
				for (const { paragraph, sentence } of highlights) {
					const highlightId = getHighlightId({
						paragraph,
						sentence,
					})

					const highlightSpan = document.getElementById(highlightId)

					if (highlightSpan === null) {
						console.error(
							"This shouldn't happen. Span corresponding to feedback element should be in DOM",
							{ paragraph, sentence }
						)

						break
					}

					highlightSpan.addEventListener("click", () =>
						onClickHighlight({
							paragraph,
							sentence,
						})
					)

					highlightSpan.addEventListener("pointerenter", () =>
						onHoverHighlight({
							paragraph,
							sentence,
						})
					)

					highlightSpan.addEventListener("pointerleave", () =>
						onUnhoverHighlight({
							paragraph,
							sentence,
						})
					)
				}
			})
		}
	})

	useEffect(() => {
		addHighlights()
	}, [highlights.length])

	const updateParagraphYOffsets = useEffectEvent(() => {
		if (ref.current === null) return

		const paragraphYOffsets: {
			paragraph: number
			yOffset: number
		}[] = []

		let currentParagraphNumber = 0

		let currentYOffset = 0

		for (const textElement of ref.current.querySelectorAll("p, div, br")) {
			if (
				textElement.textContent?.indexOf(".") !== -1 &&
				textElement.textContent?.indexOf(".") !==
					textElement.textContent?.lastIndexOf(".")
			) {
				currentParagraphNumber++

				paragraphYOffsets.push({
					paragraph: currentParagraphNumber,
					yOffset: currentYOffset,
				})
			}

			const computedStyle = window.getComputedStyle(textElement)

			currentYOffset +=
				textElement.getBoundingClientRect().height +
				parseFloat(computedStyle.paddingTop) +
				parseFloat(computedStyle.paddingBottom) +
				parseFloat(computedStyle.marginTop) +
				parseFloat(computedStyle.marginBottom)
		}

		onChangeParagraphYOffsets(paragraphYOffsets)
	})

	useEffect(() => {
		if (ref.current !== null) {
			const div = ref.current

			if (editing) {
				removeSelectTextFromChildren(div)

				removeHighlightSpansFromChildren(div)
			} else {
				addSelectTextToChildren(div)

				addHighlights()

				updateParagraphYOffsets()

				window.addEventListener("resize", updateParagraphYOffsets)

				return () => {
					window.removeEventListener(
						"resize",
						updateParagraphYOffsets
					)
				}
			}
		}
	}, [editing])

	useEffect(() => {
		for (const { paragraph, sentence, dark } of highlights) {
			const highlightSpan = document.getElementById(
				getHighlightId({
					paragraph,
					sentence,
				})
			)

			if (highlightSpan !== null)
				if (dark)
					highlightSpan.style.backgroundColor =
						colors["surface-selected-hover"]
				else highlightSpan.style.backgroundColor = colors["surface"]
		}
	}, [highlights])

	const runOnChangeHTML = useEffectEvent(
		() => ref.current && onChangeHTML(ref.current.innerHTML)
	)

	useEffect(() => {
		if (ref.current) {
			const div = ref.current

			div.focus()

			const handler = () => {
				if (
					div.innerHTML === "<br>" ||
					div.innerHTML === "<div><br></div>"
				)
					div.innerHTML = ""

				runOnChangeHTML()
			}

			div.addEventListener("input", handler)

			return () => {
				div.removeEventListener("input", handler)
			}
		}
	}, [])

	const [, rerender] = useState({})

	useEffect(() => {
		if (ref.current !== null && ref.current.innerHTML !== htmlProp) {
			ref.current.innerHTML = htmlProp

			rerender({})

			addSelectTextToChildren(ref.current)

			updateParagraphYOffsets()

			addHighlights()
		}
	}, [htmlProp])

	return (
		<div className="relative">
			<div
				contentEditable={editing}
				autoFocus
				ref={ref}
				className="min-h-[60vh] outline-none"
			/>

			{ref.current === null || ref.current.innerHTML === "" ? (
				<span className="pointer-events-none absolute top-0 opacity-40">
					Your work goes here
				</span>
			) : null}
		</div>
	)
}
