"use client"
import { useEffect, useState } from "react"

import cn from "~/utils/cn"

const Deck = () => {
	const slides = [
		<div key={0} className="w-full space-y-[2.870813397vw]">
			<div className="text-[11.4832535885vw] font-semibold leading-none tracking-tight text-white">
				Understand
			</div>

			<div className="ml-2 text-[5.74162679426vw] font-medium leading-none text-white">
				Engage easier
			</div>
		</div>,
		<div key={1} className="w-full space-y-[2.870813397vw]">
			<div className="text-[2.87081339713vw] font-medium leading-[1.25] text-white"></div>

			<div className="w-full space-y-[0.5980861244vw]">
				<div className="text-[1.1961722488vw] font-semibold leading-none text-white">
					PROBLEM
				</div>

				<div className="text-[2.87081339713vw] font-medium leading-[1.25] text-white">
					Tailored instruction is markedly difficult to provide.
				</div>
			</div>

			<div className="text-[2.87081339713vw] font-medium leading-[1.25] text-white">
				Teachers can&apos;t know what each of their students struggle
				with or why.
			</div>

			<div className="text-[2.87081339713vw] font-medium leading-[1.25] text-white">
				Even with a vague idea of what these are, there&apos;s no way to
				address them efficiently.
			</div>
		</div>,
		<div key={2} className="w-full space-y-[2.870813397vw]">
			<div className="w-full space-y-[0.5980861244vw]">
				<div className="text-[1.1961722488vw] font-semibold leading-none text-white">
					WHY IT MATTERS
				</div>

				<div className="text-[2.87081339713vw] font-medium leading-[1.25] text-white">
					Students respond best to instruction aligned with their
					specific needs and interests.
				</div>
			</div>

			<div className="text-[2.87081339713vw] font-medium leading-[1.25] text-white">
				But it&apos;s unreasonable to expect teachers to provide this
				level of attention for all their students, or anything near it.
			</div>
			<div className="text-[2.87081339713vw] font-medium leading-[1.25] text-white">
				Students are disengaged, and teachers are burning out. If
				nothing changes, this will only worsen as class sizes increase
				in the coming years.
				{/* maybe add more at beginning. not the most smooth or logical transition */}
			</div>
		</div>,
		<div key={3} className="w-full space-y-[0.5980861244vw]">
			<div className="text-[1.1961722488vw] font-semibold leading-none text-white">
				SOLUTION
			</div>

			<div className="text-[2.87081339713vw] font-medium leading-[1.25] text-white">
				We&apos;ve built a product that provides students with in-depth
				feedback on their assignments and their teachers with meaningful
				findings about them. It requires no changes to the way that
				teachers already teach.
			</div>
		</div>,
		<div key={4} className="w-full space-y-[0.5980861244vw]">
			<div className="text-[1.1961722488vw] font-semibold leading-none text-white">
				MISSION
			</div>

			<div className="text-[3.34928229665vw] font-medium leading-[1.25] text-white">
				Reengage the world&apos;s students and teachers.
			</div>
		</div>,
	]

	const [slideIndex, setSlideIndex] = useState(0)

	const [navigated, setNavigated] = useState(false)

	useEffect(() => {
		const arrowKeyHandler = ({ keyCode }: { keyCode: number }) => {
			if (keyCode === 39 || keyCode === 40) {
				setSlideIndex((slideIndex) =>
					Math.min(slideIndex + 1, slides.length - 1)
				)
			}

			if (keyCode === 37 || keyCode === 38) {
				setSlideIndex((slideIndex) => Math.max(slideIndex - 1, 0))
			}

			setNavigated(true)
		}

		document.addEventListener("keydown", arrowKeyHandler)

		return () => {
			document.removeEventListener("keydown", arrowKeyHandler)
		}
	}, [slides.length])

	return (
		<div className="flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-tr from-primary to-secondary">
			<div className="flex aspect-video w-full items-center px-[17.2248803828vw]">
				{slides[slideIndex]}
			</div>

			<div
				className={cn(
					"absolute bottom-12 text-xl font-medium leading-none text-white transition duration-300",
					navigated && "opacity-0"
				)}
			>
				Use your arrow keys to navigate
			</div>
		</div>
	)
}

export default Deck

// some spoken lines
// and this is especially true at the beginning of the year
// they'll often have 200+ students, so as helpful as it may be, it's infeasible. students may go through an entire year of school only receiving any kind of feedback once or twice
// it's what I've found to be true in my own life, what others have found to be true in their experience teaching, and what's backed up by pedagogical research
// Every student will have their own follow-up questions they keep to themselves. Additionally, addressing them will often difficult to do without the student's work pulled up in front of them, something not well-suited for the classroom settings.

// product slide
//
// differention/competitive advantage slide??
//
// growth/market slide?
