"use client"
import { useRef, useState, useEffect } from "react"

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

const Insights: React.FC<Props> = ({ assignment, insights, submission }) => {
	const headerRef = useRef<HTMLDivElement>(null)

	const [headerHeight, setHeaderHeight] = useState<number>()

	const submissionRef = useRef<HTMLDivElement>(null)

	const [submissionWidth, setSubmissionWidth] = useState<number>()

	useEffect(() => {
		const positionContent = () => {
			if (submissionRef.current) {
				setSubmissionWidth(submissionRef.current.offsetWidth)
			}

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
			></div>

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
					className="mb-[60vh] whitespace-pre-line text-[15px] leading-[2]"
				/>

				{/* {generalFeedback !== undefined && (
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
										state: update(generalFeedback.state),
									}
							)
						}
						submissionWidth={submissionWidth ?? 0}
					/>
				)} */}
			</div>

			<div
				style={{ marginTop: headerHeight ?? 0 }}
				className="relative min-w-[192px] flex-1"
			></div>
		</div>
	)
}

export default Insights
