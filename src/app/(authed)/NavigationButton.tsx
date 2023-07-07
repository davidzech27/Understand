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

const NavigationButton: React.FC<Props> = ({ text, subtext, photo, href }) => {
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
			<div className="h-9 w-9">{photo}</div>

			<div className="ml-2.5 flex flex-col">
				<span className="mb-[1px] text-sm font-medium leading-none opacity-90">
					{text}
				</span>

				{subtext !== undefined && (
					<span className="text-xs opacity-60">{subtext}</span>
				)}
			</div>
		</Link>
	)
}

export default NavigationButton
