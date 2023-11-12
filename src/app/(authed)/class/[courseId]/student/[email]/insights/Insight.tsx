"use client"
import { Suspense, use, useRef, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useHover } from "react-aria"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { ChevronDown } from "lucide-react"
import { parse } from "node-html-parser"

import formatDate from "~/utils/formatDate"
import cn from "~/utils/cn"
import Heading from "~/components/Heading"
import Await from "~/utils/Await"

interface Props {
	title: string
	content: string
	sources: {
		assignment: Promise<{
			assignmentId: string
			title: string
			dueAt?: Date
		}>
		submissionHTML: Promise<string>
		paragraphs: number[]
	}[]
	totalAssignmentsPromise: Promise<number>
}

export default function Insight({
	title,
	content,
	sources,
	totalAssignmentsPromise,
}: Props) {
	const [expanded, setExpanded] = useState(false)

	const sourceListRef = useRef<HTMLDivElement>(null)

	return (
		<div className="relative">
			<div
				onClick={() => setExpanded((prevExpanded) => !prevExpanded)}
				data-expanded={expanded}
				className="group cursor-pointer rounded-md border-[0.75px] border-border bg-surface px-6 py-5 transition-all duration-150 hover:bg-surface-hover focus-visible:outline-border"
			>
				<div className="flex justify-between">
					<Heading size="medium" className="select-text leading-none">
						{title}
					</Heading>

					<ChevronDown
						size={24}
						className="opacity-70 transition duration-300 group-data-[expanded=true]:rotate-180"
					/>
				</div>

				<p className="mb-3.5 mt-0.5 select-text">{content}</p>

				<Suspense fallback={<div className="h-[36px]" />}>
					<Await promise={totalAssignmentsPromise}>
						{(totalAssignments) => (
							<div className="flex">
								<div
									style={{
										flex: sources.length,
									}}
									className="flex flex-col space-y-1.5"
								>
									<div
										className={cn(
											"h-2.5 rounded-l-md bg-primary opacity-80",
											totalAssignments -
												sources.length ===
												0 && "rounded-r-md",
										)}
									/>

									<Heading size="small" className="px-1">
										Here: {sources.length}
									</Heading>
								</div>

								<div
									style={{
										flex: totalAssignments - sources.length,
									}}
									className="flex flex-col space-y-1.5"
								>
									<div className="h-2.5 rounded-r-md bg-secondary opacity-80" />

									{totalAssignments - sources.length > 0 ? (
										<Heading size="small" className="px-1">
											Everything else:{" "}
											{totalAssignments - sources.length}
										</Heading>
									) : null}
								</div>
							</div>
						)}
					</Await>
				</Suspense>
			</div>

			<div
				style={
					expanded
						? {
								marginTop: 10,
								maxHeight: 1000,
						  }
						: { maxHeight: 0 }
				}
				className={cn(
					"absolute left-0 right-0 z-10 overflow-y-hidden rounded-md border-border bg-surface shadow-lg shadow-[#00000012] transition-all duration-150",
					expanded && "border-x-[0.75px] border-b-[0.75px]",
				)}
			>
				<div ref={sourceListRef}>
					{sources.map((source, index) => (
						<Suspense key={index}>
							<Source {...source} />
						</Suspense>
					))}
				</div>
			</div>
		</div>
	)
}

interface SourceProps {
	assignment: Promise<{
		assignmentId: string
		title: string
		dueAt?: Date
	}>
	submissionHTML: Promise<string>
	paragraphs: number[]
}

function Source({
	assignment: assignmentPromise,
	submissionHTML,
	paragraphs,
}: SourceProps) {
	const assignment = use(assignmentPromise)

	const courseId = usePathname()?.slice(1).split("/")[1] ?? ""

	const studentEmail = usePathname()?.slice(1).split("/")[3] ?? ""

	const { hoverProps, isHovered } = useHover({})

	return (
		<div {...hoverProps}>
			<Link
				href={`/class/${courseId}/assignment/${assignment.assignmentId}/insights`}
			>
				<div className="flex cursor-pointer justify-between border-t-[0.75px] border-border px-6 py-4 transition-all duration-150 hover:bg-surface-hover">
					<span className="text-lg font-medium opacity-90">
						{assignment.title}
					</span>

					<span className="opacity-60">
						{assignment.dueAt
							? `Due ${formatDate(assignment.dueAt)}`
							: "No due date"}
					</span>
				</div>
			</Link>

			<ScrollArea.Root>
				<ScrollArea.Viewport asChild>
					<div
						style={{
							maxHeight: isHovered ? 120 : 0,
						}}
						className="overflow-y-scroll transition-all duration-150"
					>
						<Suspense>
							<SubmissionPreview
								submissionHTML={submissionHTML}
								paragraphs={paragraphs}
								courseId={courseId}
								assignmentId={assignment.assignmentId}
								studentEmail={studentEmail}
							/>
						</Suspense>
					</div>
				</ScrollArea.Viewport>

				<ScrollArea.Scrollbar orientation="vertical">
					<ScrollArea.Thumb />
				</ScrollArea.Scrollbar>
			</ScrollArea.Root>
		</div>
	)
}

interface SubmissionPreviewProps {
	submissionHTML: Promise<string>
	paragraphs: number[]
	courseId: string
	assignmentId: string
	studentEmail: string
}

function SubmissionPreview({
	submissionHTML: submissionHTMLPromise,
	paragraphs,
	courseId,
	assignmentId,
	studentEmail,
}: SubmissionPreviewProps) {
	const submissionHTML = use(submissionHTMLPromise)

	const submissionPortions = useMemo(() => {
		const submissionWithoutFontSizeStyle = submissionHTML.replaceAll(
			/font-size:\w+;/g,
			"",
		)

		if (paragraphs[0] === -1) return [submissionWithoutFontSizeStyle]

		const html = parse(submissionWithoutFontSizeStyle)

		return [...html.querySelectorAll("p, div")]
			.filter(
				(line) =>
					line.textContent !== null &&
					line.textContent.indexOf(".") !== -1 &&
					line.textContent.indexOf(".") !==
						line.textContent.lastIndexOf("."),
			)
			.filter((_, index) => paragraphs.includes(index + 1))
			.map((paragraph) => paragraph.outerHTML)
	}, [submissionHTML, paragraphs])

	return (
		<>
			{submissionPortions.map((portion, index) => (
				<Link
					href={`/class/${courseId}/insights/${assignmentId}/${studentEmail}`}
					key={index}
				>
					<div
						dangerouslySetInnerHTML={{ __html: portion }}
						className="select-text whitespace-pre-line border-t-[0.75px] border-border px-6 py-4 text-[10px] transition-all duration-150 hover:bg-surface-hover"
					/>
				</Link>
			))}
		</>
	)
}
