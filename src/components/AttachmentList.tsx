"use client"
import { useRef } from "react"

import Row from "./Row"
import Avatar from "./Avatar"

interface Props {
	items: Attachment[]
	selectionType: "multiple" | "single" | "none"
	selectionSet: Set<string>
	setSelectionSet: (
		updater: Set<string> | ((selectionSet: Set<string>) => Set<string>)
	) => void
	renderEmptyState?: React.ReactNode
	className?: string
}

interface Attachment {
	id: string
	title?: string
	url: string
	thumbnailUrl?: string
}

interface AttachmentProps extends Attachment {
	onAction: () => void
	onKeyboardFocus: () => void
	selected: boolean
}

const AttachmentList: React.FC<Props> = ({
	selectionType,
	selectionSet,
	setSelectionSet,
	...props
}) => {
	return (
		<Row.List {...props}>
			{({ item }) => (
				<Attachment
					onAction={() => {
						if (selectionType !== "none") {
							setSelectionSet((selectionSet) => {
								if (selectionSet.has(item.id)) {
									return new Set(
										selectionType === "multiple"
											? [...selectionSet].filter(
													(id) => id !== item.id
											  )
											: []
									)
								} else {
									return new Set([
										...(selectionType === "multiple"
											? selectionSet
											: []),
										item.id,
									])
								}
							})
						}
					}}
					onKeyboardFocus={() => {
						if (selectionType === "single") {
							setSelectionSet(new Set([item.id]))
						}
					}}
					selected={selectionSet.has(item.id)}
					key={item.id}
					{...item}
				/>
			)}
		</Row.List>
	)
}

const Attachment: React.FC<AttachmentProps> = ({
	title,
	url,
	thumbnailUrl,
	onAction,
	onKeyboardFocus,
	selected,
}) => {
	const linkRef = useRef<HTMLAnchorElement>(null)

	return (
		<Row.Item
			onAction={onAction}
			onKeyboardFocus={onKeyboardFocus}
			selected={selected}
		>
			<div
				ref={(element) => {
					linkRef.current &&
						element &&
						(linkRef.current.style.width = `${
							element.offsetWidth - 60
						}px`)
				}}
				className="flex h-20 cursor-pointer items-center"
			>
				<Avatar
					src={thumbnailUrl}
					name={title}
					fallbackColor="primary"
					border
					className="h-12 w-12 rounded-full"
				/>

				{/* select text not working here */}
				<div className="ml-3 flex flex-shrink flex-col">
					{title !== undefined && (
						<span className="mb-[1px] font-medium leading-none opacity-90">
							{title}
						</span>
					)}

					<a
						href={url}
						onClick={(e) => e.stopPropagation()}
						target="_blank"
						ref={linkRef}
						className="w-min overflow-hidden overflow-ellipsis whitespace-nowrap text-sm opacity-60 hover:underline"
					>
						{url}
					</a>
				</div>
			</div>
		</Row.Item>
	)
}

export default AttachmentList
