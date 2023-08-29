import Heading from "~/components/Heading"
import Modal from "~/components/Modal"

interface Props {
	open: boolean
	setOpen: (open: boolean) => void
}

export default function RateLimitModal({ open, setOpen }: Props) {
	return (
		<Modal
			open={open}
			setOpen={setOpen}
			title="You're costing us a lot of money"
		>
			<div className="space-y-2.5">
				<Heading size="large" className="select-text">
					You&apos;re over our AI rate limits, and it&apos;s costing
					us a lot of money.
				</Heading>

				<Heading size="large" className="select-text">
					Contact me at david@understand.school if you still need to
					access Understand.
				</Heading>
			</div>
		</Modal>
	)
}
