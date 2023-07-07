import { type HTMLProps, useRef, forwardRef } from "react"

import cn from "~/utils/cn"
import ListItem from "./ListItem"
import Avatar from "./Avatar"

interface Props extends HTMLProps<HTMLLIElement> {
	name: string
	subname?: string
	photoUrl?: string
	url: string
	selected?: boolean
	disabled?: boolean
	className?: string
}

const AttachmentItem = forwardRef<HTMLLIElement, Props>(
	(
		{
			name,
			subname,
			photoUrl,
			url,
			selected,
			disabled,
			className,
			...props
		},
		ref
	) => {
		const urlRef = useRef<HTMLAnchorElement>(null)

		return (
			<ListItem
				{...props}
				selected={selected}
				disabled={disabled}
				ref={(element) => {
					urlRef.current &&
						element &&
						Number(urlRef.current.style.width.match(/\d+/g)?.[0]) >=
							element.offsetWidth - 60 &&
						(urlRef.current.style.width = `${
							element.offsetWidth - 60
						}px`)

					if (typeof ref === "function") {
						ref(element)
					} else if (ref !== null) {
						ref.current = element
					}
				}}
				className={cn("flex h-20 items-center space-x-3", className)}
			>
				<Avatar
					src={photoUrl}
					name={name}
					fallbackColor="secondary"
					className="h-12 w-12"
				/>

				<div className="flex flex-1 flex-col">
					<div className="flex w-full justify-between">
						<span className="font-medium opacity-80">{name}</span>

						{subname && (
							<span className="relative top-[2px] text-sm opacity-60">
								{subname}
							</span>
						)}
					</div>

					<a
						href={url}
						onClick={(e) => e.stopPropagation()}
						target="_blank"
						rel="noreferrer"
						ref={urlRef}
						className="w-min overflow-hidden overflow-ellipsis whitespace-nowrap text-sm opacity-60 hover:underline"
					>
						{url}
					</a>
				</div>
			</ListItem>
		)
	}
)

AttachmentItem.displayName = "AttachmentItem"

export default AttachmentItem
