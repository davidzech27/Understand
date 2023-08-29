import Heading from "~/components/Heading"
import Modal from "~/components/Modal"

interface Props {
	open: boolean
	setOpen: (open: boolean) => void
	feature: string
}

export default function FeatureBlockModal({ open, setOpen, feature }: Props) {
	return (
		<Modal open={open} setOpen={setOpen} title="Feature blocked">
			<div className="space-y-2.5">
				<Heading size="large" className="select-text">
					You must be registered with a school to {feature} in
					Understand.
				</Heading>

				<Heading size="large" className="select-text">
					Contact me at david@understand.school if you want Understand
					at your school. (You really should)
				</Heading>
			</div>
		</Modal>
	)
}
