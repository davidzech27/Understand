import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import Heading from "./Heading"

interface Props {
	children: React.ReactNode
	title: string
	open: boolean
	setOpen: (open: boolean) => void
	footer?: React.ReactNode
}

export default function Modal({
	children,
	title,
	open,
	setOpen,
	footer,
}: Props) {
	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-[#00000060] duration-150" />

				<Dialog.Content className="fixed left-[12.5vw] top-[16.6667vh] z-50 flex h-2/3 w-3/4 flex-col justify-between rounded-md bg-white">
					<div className="mx-6 mt-6 flex items-center justify-between">
						<Dialog.Title asChild>
							<Heading size="2xLarge" className="mb-0.5">
								{title}
							</Heading>
						</Dialog.Title>

						<Dialog.Close asChild>
							<div className="relative bottom-[1px] -m-2 cursor-pointer rounded-lg p-1 transition-all duration-150 hover:bg-surface-hover">
								<X height={32} width={32} />
							</div>
						</Dialog.Close>
					</div>

					<div className="m-6 h-full">{children}</div>

					{footer}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
