"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

import cn from "~/utils/cn"

interface Props {
	text: string
	subtext?: string
	photo: React.ReactNode
	href: string
}

export default function NavigationButton({
	text,
	subtext,
	photo,
	href,
}: Props) {
	const pathname = usePathname()

	return (
		<Link
			href={href}
			prefetch={true}
			className={cn(
				"flex items-center rounded-xl px-3 py-2.5 transition-colors duration-150",
				pathname?.startsWith(href)
					? "bg-surface-selected hover:bg-surface-selected-hover"
					: "hover:bg-surface-hover"
			)}
		>
			{photo !== null ? (
				<div className="flex h-9 w-9 items-center justify-center">
					{photo}
				</div>
			) : (
				<div className="h-9 w-0" />
			)}

			<div className="ml-2.5 flex flex-col">
				<span
					className={cn(
						"mb-[1px] font-medium leading-none opacity-90",
						subtext === undefined ? "text-base" : "text-sm"
					)}
				>
					{text}
				</span>

				{subtext !== undefined && (
					<span className="text-xs opacity-60">{subtext}</span>
				)}
			</div>
		</Link>
	)
}
