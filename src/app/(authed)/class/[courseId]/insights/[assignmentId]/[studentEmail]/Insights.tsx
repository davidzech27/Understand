"use client"
import { useRef, useState, useEffect } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { motion } from "framer-motion"
import cn from "~/utils/cn"

interface Props {
	assignment: {
		title: string
		description?: string
	}
	insights: {
		type: "strength" | "weakness"
		content: string
		paragraphs: number[]
	}[]
	submission: string
}

export default function Insights({ assignment, insights, submission }: Props) {
	const [insightHovers, setInsightHovers] = useState<boolean[]>(
		insights
			.filter((insight) => insight.paragraphs[0] !== -1)
			.map(() => false)
	)

	const [tops, setTops] = useState<number[]>()

	useEffect(() => {
		insights
			.filter((insight) => insight.paragraphs[0] !== -1)
			.forEach(({ paragraphs: [firstParagraph] }, index) => {
				if (
					firstParagraph === undefined ||
					submissionRef.current === null
				)
					return

				const firstParagraphIndex = firstParagraph - 1

				let paragraphIndex = 0

				let top = 0

				for (const line of submissionRef.current.querySelectorAll(
					"p, div"
				)) {
					if (
						line.textContent !== null &&
						line.textContent.indexOf(".") !== -1 &&
						line.textContent.indexOf(".") !==
							line.textContent.lastIndexOf(".")
					) {
						if (firstParagraphIndex === paragraphIndex) break

						paragraphIndex++
					}

					top += line.clientHeight
				}

				setTops((tops) => {
					tops = [...(tops ?? [])]

					tops[index] = top

					return tops
				})
			})
	}, [insights])

	const submissionRef = useRef<HTMLDivElement>(null)

	if (submissionRef.current !== null) {
		const paragraphs = [
			...submissionRef.current.querySelectorAll("p, div"),
		].filter(
			(line) =>
				line.textContent !== null &&
				line.textContent.indexOf(".") !== -1 &&
				line.textContent.indexOf(".") !==
					line.textContent.lastIndexOf(".")
		)

		insights
			.filter((insights) => insights.paragraphs[0] !== -1)
			.forEach(({ paragraphs: paragraphIndexes }, index) => {
				if (insightHovers[index]) {
					const insightParagraphs = paragraphIndexes
						.map((index) => paragraphs[index - 1])
						.filter(Boolean)

					for (const paragraph of insightParagraphs) {
						const precedingSpaces = (
							paragraph.textContent?.match(/^\s+/g)?.[0] ?? ""
						).replaceAll(String.fromCharCode(160), "&nbsp;")

						const innerHTMLWithoutPrecedingSpaces =
							paragraph.innerHTML.replace(precedingSpaces, "")

						submission = submission.replace(
							paragraph.innerHTML,
							precedingSpaces + innerHTMLWithoutPrecedingSpaces
						)

						const segment = innerHTMLWithoutPrecedingSpaces.trim()

						submission = submission.replace(
							segment,
							renderToStaticMarkup(
								<span
									dangerouslySetInnerHTML={{
										__html: segment,
									}}
									style={{
										marginTop: -6,
										marginBottom: -6,
										marginLeft: -4,
										marginRight: -4,
										paddingTop: 6,
										paddingBottom: 6,
										paddingLeft: 4,
										paddingRight: 4,
										borderRadius: 6,
										userSelect: "text",
									}}
									className="animate-[highlight-fade-in] bg-surface-selected-hover transition-all duration-150"
								/>
							)
						)
					}
				}
			})
	}

	const headerRef = useRef<HTMLDivElement>(null)

	const [headerHeight, setHeaderHeight] = useState<number>()

	useEffect(() => {
		const positionContent = () => {
			if (headerRef.current) {
				setHeaderHeight(headerRef.current.offsetHeight + 20)
			}
		}

		positionContent()

		window.addEventListener("resize", positionContent)

		return () => {
			window.removeEventListener("resize", positionContent)
		}
	}, [])

	return (
		<div className="relative flex h-full w-full overflow-y-scroll overscroll-y-contain rounded-md border border-border bg-white pt-16 shadow-lg shadow-[#00000016]">
			<div
				style={{ marginTop: headerHeight ?? 0 }}
				className="relative min-w-[192px] flex-[0.75]"
			>
				{tops &&
					insights
						.filter((insight) => insight.paragraphs[0] !== -1)
						.filter((_, index) => index % 2 === 1)
						.map(({ content }, index) => (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 0.8, y: 0 }}
								transition={{
									duration: 0.35,
									ease: "easeOut",
								}}
								onMouseEnter={() =>
									setInsightHovers((hovers) => [
										...hovers.slice(0, index * 2 + 1),
										true,
										...hovers.slice(index * 2 + 1 + 1),
									])
								}
								onMouseLeave={() =>
									setInsightHovers((hovers) => [
										...hovers.slice(0, index * 2 + 1),
										false,
										...hovers.slice(index * 2 + 1 + 1),
									])
								}
								key={index}
								style={{ top: tops[index * 2 + 1] }}
								className={cn(
									"absolute left-4 right-4 select-text rounded-md border-[0.75px] border-border bg-surface px-3 py-2 shadow-[#E5E5E5]",
									insightHovers[index * 2 + 1]
										? "shadow-md"
										: "shadow-sm"
								)}
							>
								{content}
							</motion.div>
						))}
			</div>

			<div className="relative flex basis-[704px] flex-col">
				<div ref={headerRef} className="min-h-12 flex flex-col">
					<div className="select-text text-2xl font-bold">
						{assignment.title}
					</div>

					{assignment.description !== undefined && (
						<p className="mt-3.5 mb-0.5 select-text text-sm opacity-60">
							{assignment.description}
						</p>
					)}
				</div>

				<hr className="mt-2 mb-3" />

				<div
					dangerouslySetInnerHTML={{ __html: submission }}
					ref={submissionRef}
				/>

				<div>
					<div className="h-4"></div>
				</div>

				<div className="space-y-2.5">
					{insights
						.filter((insight) => insight.paragraphs[0] === -1)
						.map(({ content }, index) => (
							<div
								key={index}
								className="select-text rounded-md border-[0.75px] border-border bg-surface px-3 py-2 opacity-80 shadow-sm shadow-[#E5E5E5]"
							>
								{content}
							</div>
						))}
				</div>

				<div>
					<div className="h-16"></div>
				</div>
			</div>

			<div
				style={{ marginTop: headerHeight ?? 0 }}
				className="relative min-w-[192px] flex-1"
			>
				{tops &&
					insights
						.filter((insight) => insight.paragraphs[0] !== -1)
						.filter((_, index) => index % 2 === 0)
						.map(({ content }, index) => (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 0.8, y: 0 }}
								transition={{
									duration: 0.35,
									ease: "easeOut",
								}}
								onMouseEnter={() =>
									setInsightHovers((hovers) => [
										...hovers.slice(0, index * 2),
										true,
										...hovers.slice(index * 2 + 1),
									])
								}
								onMouseLeave={() =>
									setInsightHovers((hovers) => [
										...hovers.slice(0, index * 2),
										false,
										...hovers.slice(index * 2 + 1),
									])
								}
								key={index}
								style={{ top: tops[index * 2] }}
								className={cn(
									"absolute left-4 right-4 select-text rounded-md border-[0.75px] border-border bg-surface px-3 py-2 shadow-[#E5E5E5]",
									insightHovers[index * 2]
										? "shadow-md"
										: "shadow-sm"
								)}
							>
								{content}
							</motion.div>
						))}
			</div>
		</div>
	)
}
