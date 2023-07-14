"use client"
import Link from "next/link"
import { Plus, ChevronDown, FilePlus2, UserPlus } from "lucide-react"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { usePathname } from "next/navigation"

export default function TopActions() {
	const pathname = usePathname()

	return (
		<NavigationMenu.Root delayDuration={0} className="relative">
			<NavigationMenu.List>
				<NavigationMenu.Item>
					<NavigationMenu.Trigger asChild>
						<button className="flex h-8 items-center space-x-[1px] rounded-md bg-background-raised  px-2 transition-all duration-150 hover:bg-background-raised-hover">
							<Plus size={20} className="opacity-80" />

							<ChevronDown
								size={20}
								className="relative top-[1px] opacity-60"
							/>
						</button>
					</NavigationMenu.Trigger>

					<NavigationMenu.Content className="flex flex-col space-y-1.5 p-3">
						<NavigationMenu.Link
							asChild
							active={pathname === "/assignment/create"}
						>
							<Link
								href="/assignment/create"
								className="relative flex h-14 w-60 cursor-pointer items-center rounded-md border-[0.75px] border-primary bg-primary/5 outline-none transition-all duration-150 focus-within:bg-primary/10 hover:bg-primary/10 data-[active]:bg-primary/10"
							>
								<FilePlus2
									size={18}
									className="ml-6 text-primary opacity-80"
								/>

								<div className="ml-5 font-medium opacity-70">
									Create assignment
								</div>
							</Link>
						</NavigationMenu.Link>

						<NavigationMenu.Link
							asChild
							active={pathname === "/class/create"}
						>
							<Link
								href="/class/create"
								className="relative flex h-14 w-60 cursor-pointer items-center rounded-md border-[0.75px] border-secondary bg-secondary/5 outline-none transition-all duration-150 hover:bg-secondary/10 focus-visible:bg-secondary/10 data-[active]:bg-secondary/10"
							>
								<UserPlus
									size={18}
									className="ml-6 text-secondary opacity-80"
								/>

								<div className="ml-5 font-medium opacity-70">
									Create class
								</div>
							</Link>
						</NavigationMenu.Link>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
			</NavigationMenu.List>

			<div className="absolute top-[calc(100%+6px)] right-0 z-50">
				{/* can't get exit animation to work yet */}
				<NavigationMenu.Viewport className="animate-[scale-in] rounded-md border-[0.75px] border-border bg-surface shadow-lg shadow-[#00000016] transition-all duration-150" />
			</div>
		</NavigationMenu.Root>
	)
}
