"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

import cn from "../utils/cn"

interface Props {
	children: React.ReactNode
	href: string
	className?: string
}

const LinkButton: React.FC<Props> = ({ children, href, className }) => {
	return (
		<Link
			href={href}
			className={cn(
				"rounded-md py-2.5 px-6 text-lg font-medium transition-all duration-150",
				usePathname() === href
					? "bg-surface-selected opacity-80 focus-within:bg-surface-selected-hover hover:bg-surface-selected-hover"
					: "opacity-60 hover:bg-surface-hover hover:opacity-80 focus-visible:bg-surface-hover focus-visible:opacity-80",
				className
			)}
		>
			{children}
		</Link>
	)
}

export default LinkButton
