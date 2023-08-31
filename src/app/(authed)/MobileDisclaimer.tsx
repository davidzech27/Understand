"use client"
import { useState, useEffect } from "react"

import Modal from "~/components/Modal"
import Button from "~/components/Button"

function isMobileDevice() {
	return window.innerWidth <= 1024
}

export default function MobileDisclaimer() {
	const [modalOpen, setModalOpen] = useState(false)

	useEffect(() => {
		if (isMobileDevice()) {
			setModalOpen(true)
		}
	}, [])

	return (
		<Modal open={modalOpen} setOpen={setModalOpen} title="You're on mobile">
			<div className="flex h-full flex-col justify-between">
				<p className="text-lg font-medium text-black/90">
					Unfortunately, Understand isn&apos;t yet optimized for
					mobile devices, so you probably won&apos;t have the best
					experience on one. We&apos;re trying to fix this. If
					possible, use a device with a larger screen size.
				</p>

				<Button onClick={() => setModalOpen(false)} size="large">
					Okay
				</Button>
			</div>
		</Modal>
	)
}
