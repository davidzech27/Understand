"use client"
import { Suspense, use, useMemo, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useHover } from "react-aria"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { parse } from "node-html-parser"

import Avatar from "~/components/Avatar"
import cn from "~/utils/cn"

interface Props {
	type: "strength" | "weakness"
	content: string
	sources: {
		student: Promise<{
			email: string
			name: string
			photo?: string
		}>
		submission: Promise<string>
		paragraphs: number[]
	}[]
}

export default function Insight({ type, content, sources }: Props) {
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
	student: Promise<{
		email: string
		name: string
		photo?: string
	}>
	submission: Promise<string>
	paragraphs: number[]
}

const Source: React.FC<SourceProps> = ({
	student: studentPromise,
	submission,
	paragraphs,
}) => {
	const student = use(studentPromise)

	const courseId = usePathname()?.slice(1).split("/")[1] ?? ""

	const assignmentId = usePathname()?.slice(1).split("/")[3] ?? ""

	const { hoverProps, isHovered } = useHover({})

	return (
		<div {...hoverProps}>
			<Link href={`/class/${courseId}/student/${student.email}`}>
				<div className="flex items-center space-x-3 border-t-[0.75px] border-border px-6 py-4 transition-all duration-150 hover:bg-surface-hover">
					<Avatar
						src={student.photo}
						name={student.name}
						fallbackColor="primary"
						className="h-11 w-11"
					/>

					<div className="flex flex-col space-y-1">
						<span className="text-lg font-medium leading-none opacity-90">
							{student.name}
						</span>

						<span className="text-sm leading-none opacity-70">
							{student.email}
						</span>
					</div>
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
								assignmentId={assignmentId}
								studentEmail={student.email}
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
