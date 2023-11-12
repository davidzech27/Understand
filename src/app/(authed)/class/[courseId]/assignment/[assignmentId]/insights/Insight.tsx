"use client"
import { Suspense, use, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useHover } from "react-aria"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { ChevronDown } from "lucide-react"
import { parse } from "node-html-parser"

import Avatar from "~/components/Avatar"
import cn from "~/utils/cn"
import Heading from "~/components/Heading"
import Await from "~/utils/Await"

interface Props {
	title: string
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
	totalStudentsPromise: Promise<number>
}

export default function Insight({
	title,
	content,
	sources,
	totalStudentsPromise,
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
					<Await promise={totalStudentsPromise}>
						{(totalStudents) => (
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
											totalStudents - sources.length ===
												0 && "rounded-r-md",
										)}
									/>

									<Heading size="small" className="px-1">
										Here: {sources.length}
									</Heading>
								</div>

								<div
									style={{
										flex: totalStudents - sources.length,
									}}
									className="flex flex-col space-y-1.5"
								>
									<div className="h-2.5 rounded-r-md bg-secondary opacity-80" />

									{totalStudents - sources.length > 0 ? (
										<Heading size="small" className="px-1">
											Everyone else:{" "}
											{totalStudents - sources.length}
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
	student: Promise<{
		email: string
		name: string
		photo?: string
	}>
	submission: Promise<string>
	paragraphs: number[]
}

function Source({
	student: studentPromise,
	submission,
	paragraphs,
}: SourceProps) {
	const student = use(studentPromise)

	const courseId = usePathname()?.slice(1).split("/")[1] ?? ""

	const assignmentId = usePathname()?.slice(1).split("/")[3] ?? ""

	const { hoverProps, isHovered } = useHover({})

	return (
		<div {...hoverProps}>
			<Link href={`/class/${courseId}/student/${student.email}/insights`}>
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

function SubmissionPreview({
	submission: submissionPromise,
	paragraphs,
	courseId,
	assignmentId,
	studentEmail,
}: SubmissionPreviewProps) {
	const submission = use(submissionPromise)

	const submissionPortions = useMemo(() => {
		const submissionWithoutFontSizeStyle = submission.replaceAll(
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
