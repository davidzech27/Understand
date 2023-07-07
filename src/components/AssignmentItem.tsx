"use client"
import Link from "next/link"
import { forwardRef } from "react"

import formatDate from "~/utils/formatDate"
import ListItem from "./ListItem"

interface Props {
	title: string
	href: string
	dueAt?: Date
	selected?: boolean
	disabled?: boolean
	className?: string
}

const AssignmentItem = forwardRef<HTMLLIElement, Props>(
	({ title, href, dueAt, selected, disabled, className }, ref) => {
		return (
			<ListItem
				selected={selected}
				disabled={disabled}
				ref={ref}
				className={className}
			>
				<Link
					href={href}
					prefetch={true}
					className="flex h-20 items-center justify-between"
				>
					<span className="text-lg font-medium opacity-90">
						{title}
					</span>

					<span className="opacity-60">
						{dueAt ? `Due ${formatDate(dueAt)}` : "No due date"}
					</span>
				</Link>
			</ListItem>
		)
	}
)

AssignmentItem.displayName = "AssignmentItem"

export default AssignmentItem
