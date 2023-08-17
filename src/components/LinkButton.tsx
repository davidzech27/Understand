"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

import cn from "../utils/cn"

interface Props extends React.PropsWithChildren {
	href: string
	className?: string
}

export default function LinkButton({ children, href, className }: Props) {
	const pathname = usePathname()

	return (
		<Link
			href={href}
			prefetch={true}
			className={cn(
				"rounded-md px-6 py-2.5 text-center text-lg font-medium transition-all duration-150",
				pathname === href
					? "bg-surface-selected opacity-80 focus-within:bg-surface-selected-hover hover:bg-surface-selected-hover"
					: "opacity-60 hover:bg-surface-hover hover:opacity-80 focus-visible:bg-surface-hover focus-visible:opacity-80",
				className
			)}
		>
			{children}
		</Link>
	)
}
