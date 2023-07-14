import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

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
				<Dialog.Overlay className="fixed inset-0 z-50 bg-[#00000060] fade-in fade-out duration-150" />

				<Dialog.Content className="fixed left-0 top-0 z-50 flex h-3/5 w-2/3 translate-x-1/4 translate-y-1/3 flex-col justify-between rounded-md bg-white fade-in fade-out duration-150">
					<div className="mx-6 mt-6 flex items-center justify-between">
						<Dialog.Title className="mb-0.5 text-2xl font-medium leading-none opacity-80">
							{title}
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
