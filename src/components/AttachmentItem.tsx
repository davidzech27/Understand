import { useRef, forwardRef, type HTMLProps, type ForwardedRef } from "react"

import cn from "~/utils/cn"
import ListItem from "./ListItem"
import Avatar from "./Avatar"

interface Props extends HTMLProps<HTMLLIElement> {
	name: string
	subname?: string
	photo?: string
	url: string
	selected?: boolean
	disabled?: boolean
	className?: string
}

function AttachmentItem(
	{
		name,
		subname,
		photo,
		url,
		selected,
		disabled,
		className,
		...props
	}: Props,
	ref: ForwardedRef<HTMLLIElement>,
) {
	const urlRef = useRef<HTMLAnchorElement>(null)

	return (
		<ListItem
			{...props}
			selected={selected}
			disabled={disabled}
			ref={(element) => {
				if (urlRef.current && element)
					urlRef.current.style.width = `${Math.min(
						element.offsetWidth - 100,
						parseInt(
							window.getComputedStyle(urlRef.current).width,
						) + 1,
					)}px`

				if (typeof ref === "function") {
					ref(element)
				} else if (ref !== null) {
					ref.current = element
				}
			}}
			className={cn("flex h-20 items-center space-x-3", className)}
		>
			<Avatar
				src={photo}
				name={name}
				fallbackColor="secondary"
				className="h-12 w-12 shrink-0"
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

export default forwardRef(AttachmentItem)
