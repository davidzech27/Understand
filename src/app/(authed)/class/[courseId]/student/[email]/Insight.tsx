"use client"
import { Suspense, use, useRef, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useHover } from "react-aria"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { parse } from "node-html-parser"

import FormattedDate from "~/utils/FormattedDate"
import cn from "~/utils/cn"

interface Props {
	content: string
	sources: {
		assignment: Promise<{
			assignmentId: string
			title: string
			dueAt?: Date
		}>
		submission: Promise<string>
		paragraphs: number[]
	}[]
}

const Insight: React.FC<Props> = ({ content, sources }) => {
	const { hoverProps, isHovered } = useHover({})

	const sourceListRef = useRef<HTMLDivElement>(null)

	return (
		<div {...hoverProps}>
			<div className="block select-text rounded-md border-[0.75px] border-border bg-surface px-6 py-4 transition-all duration-150 hover:bg-surface-hover focus-visible:outline-border">
				{content}
			</div>

			<div
				style={
					isHovered
						? {
								marginTop: 10,
								maxHeight: 1000,
						  }
						: { maxHeight: 0 }
				}
				className={cn(
					"overflow-y-hidden rounded-md border-border bg-surface shadow-lg shadow-[#00000012] transition-all duration-150",
					isHovered && "border-x-[0.75px] border-b-[0.75px]"
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
	submission: Promise<string>
	paragraphs: number[]
}

const Source: React.FC<SourceProps> = ({
	assignment: assignmentPromise,
	submission,
	paragraphs,
}) => {
	const assignment = use(assignmentPromise)

	const courseId = usePathname()?.slice(1).split("/")[1] ?? ""

	const studentEmail = usePathname()?.slice(1).split("/")[3] ?? ""

	const { hoverProps, isHovered } = useHover({})

	return (
		<div {...hoverProps}>
			<Link
				href={`/class/${courseId}/assignment/${assignment.assignmentId}`}
			>
				<div className="flex cursor-pointer justify-between border-t-[0.75px] border-border px-6 py-4 transition-all duration-150 hover:bg-surface-hover">
					<span className="text-lg font-medium opacity-90">
						{assignment.title}
					</span>

					<span className="opacity-60">
						{assignment.dueAt ? (
							<FormattedDate
								prefix="Due "
								date={assignment.dueAt}
							/>
						) : (
							"No due date"
						)}
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
								submission={submission}
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
	submission: Promise<string>
	paragraphs: number[]
	courseId: string
	assignmentId: string
	studentEmail: string
}

const SubmissionPreview: React.FC<SubmissionPreviewProps> = ({
	submission: submissionPromise,
	paragraphs,
	courseId,
	assignmentId,
	studentEmail,
}) => {
	const submission = use(submissionPromise)

	const submissionPortions = useMemo(() => {
		const submissionWithoutFontSizeStyle = submission.replaceAll(
			/font-size:\w+;/g,
			""
		)

		if (paragraphs[0] === -1) return [submissionWithoutFontSizeStyle]

		const html = parse(submissionWithoutFontSizeStyle)

		return [...html.querySelectorAll("p, div")]
			.filter(
				(line) =>
					line.textContent !== null &&
					line.textContent.indexOf(".") !== -1 &&
					line.textContent.indexOf(".") !==
						line.textContent.lastIndexOf(".")
			)
			.filter((_, index) => paragraphs.includes(index + 1))
			.map((paragraph) => paragraph.outerHTML)
	}, [submission, paragraphs])

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

export default Insight
