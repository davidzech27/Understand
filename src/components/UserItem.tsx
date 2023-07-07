"use client"
import Link from "next/link"
import { forwardRef } from "react"

import cn from "~/utils/cn"
import ListItem from "./ListItem"
import Avatar from "./Avatar"

interface Props {
	email: string
	name?: string
	photo?: string
	note?: string
	href?: string
	disabled?: boolean
	selected?: boolean
	className?: string
}

const UserItem = forwardRef<HTMLLIElement, Props>(
	(
		{ email, name, photo, note, href, disabled, selected, className },
		ref
	) => {
		const inner = (
			<>
				<div className="flex items-center">
					<Avatar
						src={photo}
						name={name ?? email}
						fallbackColor="primary"
						className="h-11 w-11 rounded-full"
					/>

					<div className="ml-3 flex flex-col">
						<span className="mb-[1px] font-medium leading-none opacity-90">
							{name ?? email}
						</span>

						{name && (
							<span className="text-sm opacity-60">{email}</span>
						)}
					</div>
				</div>

				{note && <span className="italic opacity-60">{note}</span>}
			</>
		)

		if (href !== undefined && !disabled) {
			return (
				<ListItem selected={selected} ref={ref}>
					<Link
						href={href}
						prefetch={true}
						className={cn(
							"flex h-20 items-center justify-between",
							className
						)}
					>
						{inner}
					</Link>
				</ListItem>
			)
		} else {
			return (
				<ListItem
					selected={selected}
					disabled={disabled}
					ref={ref}
					className={cn(
						"flex h-20 items-center justify-between",
						className
					)}
				>
					{inner}
				</ListItem>
			)
		}
	}
)

UserItem.displayName = "UserItem"

export default UserItem
