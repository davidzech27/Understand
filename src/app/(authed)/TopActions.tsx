"use client"
import Link from "next/link"
import { Plus, ChevronDown, FilePlus2, UserPlus } from "lucide-react"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { usePathname } from "next/navigation"

interface Props {
	isTeacher: boolean
}

const TopActions = () => {
	const pathname = usePathname()

	return (
		<NavigationMenu.Root className="relative">
			<NavigationMenu.List>
				<NavigationMenu.Item>
					<NavigationMenu.Trigger asChild>
						<button className="flex h-8 items-center space-x-[1px] rounded-md border-border bg-background-raised  px-2 transition-all duration-150 hover:bg-background-raised-hover">
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
								className="relative flex h-14 w-60 items-center rounded-md border-[0.75px] border-primary transition-all duration-150 hover:bg-primary/10 data-[active]:bg-primary/10"
							>
								<FilePlus2
									size={18}
									className="ml-6 opacity-90"
								/>

								<div className="ml-5 opacity-80">
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
								className="relative flex h-14 w-60 items-center rounded-md border-[0.75px] border-secondary transition-all duration-150 hover:bg-secondary/10 data-[active]:bg-secondary/10"
							>
								<UserPlus
									size={18}
									className="ml-6 opacity-90"
								/>

								<div className="ml-5 opacity-80">
									Create class
								</div>
							</Link>
						</NavigationMenu.Link>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
			</NavigationMenu.List>

			<div className="absolute top-[calc(100%+6px)] right-0 z-50">
				<NavigationMenu.Viewport className="rounded-md border-[0.75px] border-border bg-surface shadow-lg shadow-[#00000016] transition-all duration-500 ease-out data-[state=hidden]:animate-[scale-out] data-[state=visible]:animate-[scale-in]" />
			</div>
		</NavigationMenu.Root>
	)
}

export default TopActions
