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
				"whitespace-pre rounded-md px-6 py-2.5 text-center text-lg font-semibold tracking-[0.010em] text-black/70 transition-all duration-150",
				pathname === href
					? "bg-surface-selected hover:bg-surface-selected-hover focus-visible:bg-surface-selected-hover active:bg-surface-selected-hover"
					: "bg-surface hover:bg-surface-hover focus-visible:bg-surface-hover active:bg-surface-hover",
				className,
			)}
		>
			{children}
		</Link>
	)
}
