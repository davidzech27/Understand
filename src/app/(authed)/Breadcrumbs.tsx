"use client"
import { use } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { type Course } from "~/data/Course"
import GradientText from "~/components/GradientText"

interface Props {
	coursesPromise: Promise<Course[]>
}

export default function Breadcrumbs({ coursesPromise }: Props) {
	const pathname = usePathname()

	const firstSegment = pathname?.split("/")[1]
	const secondSegment = pathname?.split("/")[2]

	const pageInfo =
		firstSegment === "home"
			? { name: "home" as const }
			: firstSegment === "profile"
			? { name: "profile" as const }
			: firstSegment === "class"
			? secondSegment === "create"
				? { name: "createClass" as const }
				: secondSegment !== undefined
				? { name: "class" as const, courseId: secondSegment }
				: undefined
			: firstSegment === "assignment" && secondSegment === "create"
			? { name: "createAssignment" as const }
			: undefined

	const course =
		pageInfo && pageInfo.name === "class"
			? use(coursesPromise).find(({ id }) => id === pageInfo.courseId)
			: undefined

	return (
		<div className="flex items-center justify-center">
			<Link
				href="/"
				className="transition-opacity duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
			>
				<GradientText asChild>
					<span className="cursor-pointer text-2xl font-extrabold tracking-tight text-white">
						Understand
					</span>
				</GradientText>
			</Link>

			{pageInfo !== undefined && (
				<>
					<ChevronRight
						size={22}
						className="ml-1.5 mr-1 text-black/90"
					/>

					{
						{
							home: (
								<span className="text-xl font-semibold leading-none text-black/90">
									Home
								</span>
							),
							profile: (
								<span className="text-xl font-semibold leading-none text-black/90">
									Profile
								</span>
							),
							class: course && (
								<Link
									href={`/class/${course.id}`}
									className="transition duration-150 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
								>
									{course.section !== undefined ? (
										<div className="flex flex-col">
											<span className="mb-0.5 text-base font-medium leading-none text-black/90">
												{course.name}
											</span>

											<span className="text-xs leading-none text-black/60">
												{course.section}
											</span>
										</div>
									) : (
										<span className="text-xl font-semibold leading-none text-black/90">
											{course.name}
										</span>
									)}
								</Link>
							),
							createClass: (
								<span className="text-xl font-semibold leading-none text-black/90">
									Create class
								</span>
							),
							createAssignment: (
								<span className="text-xl font-semibold leading-none text-black/90">
									Create assignment
								</span>
							),
						}[pageInfo.name]
					}
				</>
			)}
		</div>
	)
}
