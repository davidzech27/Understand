"use client"
import { useState } from "react"
import { motion } from "framer-motion"

export default function ReviewScroller() {
	const [, setScrollerHovered] = useState(false) // in the future use this to slow down scrolling. https://stackoverflow.com/questions/70263043/change-animation-duration-without-reset-on-framer-motion

	return (
		<div className="relative justify-center overflow-hidden">
			<motion.div
				animate={{
					y: "100vh",
				}}
				transition={{
					duration: 15,
					ease: "linear",
					repeat: Infinity,
					repeatType: "loop",
				}}
				className="absolute bottom-0 flex h-[200vh] w-full flex-col gap-1 pl-10 pr-12"
			>
				{Array(5)
					.fill(0)
					.map((_, index) => (
						<div
							onMouseEnter={() => setScrollerHovered(true)}
							onMouseLeave={() => setScrollerHovered(false)}
							key={index}
							className="w-full flex-1 rounded-lg border-x border-y"
						></div>
					))}
				{Array(5)
					.fill(0)
					.map((_, index) => (
						<div
							onMouseEnter={() => setScrollerHovered(true)}
							onMouseLeave={() => setScrollerHovered(false)}
							key={index}
							className="w-full flex-1 rounded-lg border-x border-y"
						></div>
					))}
			</motion.div>
		</div>
	)
}
