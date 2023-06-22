"use client"
import { useEffect, useState } from "react"

import cn from "~/utils/cn"

const Deck = () => {
	const slides = [
		<div key={0} className="w-full space-y-12">
			<div className="text-[12rem] font-semibold leading-none tracking-tight text-white">
				Understand
			</div>

			<div className="ml-2 text-[6rem] font-medium leading-none text-white">
				Engage easier
			</div>
		</div>,

		<div key={1} className="w-full space-y-12">
			<div className="text-[3rem] font-medium leading-[1.25] text-white">
				Tailored instruction is markedly difficult to provide.
			</div>

			<div className="text-[3rem] font-medium leading-[1.25] text-white">
				Teachers can&apos;t know what each of their students struggle
				with or why they do.
			</div>

			<div className="text-[3rem] font-medium leading-[1.25] text-white">
				Even when they have a vague idea, these can&apos;t efficiently
				be addressed during class time.
			</div>
		</div>,
		<div key={2} className="w-full space-y-12">
			<div className="text-[3rem] font-medium leading-[1.25] text-white">
				Students respond best to instruction aligned with their specific
				needs and interests.
			</div>

			<div className="text-[3rem] font-medium leading-[1.25] text-white">
				But it&apos;s unreasonable to expect teachers to provide this
				level of attention for all their students, or anything near it.
			</div>

			<div className="text-[3rem] font-medium leading-[1.25] text-white">
				Students are disengaged, and teachers are burning out. If
				nothing changes, this will only worsen as class sizes increase
				in the coming years.
			</div>
		</div>,
		<div key={3} className="w-full space-y-2.5">
			<div className="text-[1.25rem] font-semibold leading-none text-white">
				SOLUTION
			</div>

			<div className="text-[3rem] font-medium leading-[1.25] text-white">
				We&apos;ve built a product that provides students with in-depth
				feedback on their assignments and their teachers with meaningful
				findings about them.
			</div>
		</div>,
		<div key={4} className="w-full space-y-2.5">
			<div className="text-[1.25rem] font-semibold leading-none text-white">
				MISSION
			</div>

			<div className="text-[3.5rem] font-medium leading-[1.25] text-white">
				Reengage the world&apos;s students and teachers
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
		<div className="flex h-screen w-full items-center justify-center bg-gradient-to-tr from-primary to-secondary">
			<div className="flex aspect-video w-full items-center px-72">
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

// Tailored instruction is markedly difficult to provide.

//

//
// and this is especially true at the beginning of the year, before teachers are aquainted with

// they'll often have 200+ students, so as helpful as it may be, it's infeasible. students may go through an entire year of school only receiving any kind of feedback once or twice

// Students respond best to instruction aligned with their specific needs and interests.
// it's what I've found to be true in my own life, what others have found to be true in their experience teaching, and what's backed up by pedagogical research
// But it's unreasonable to expect teachers to provide this level of attention for all their students.

// As a result students are disengaged, and teachers are burning out. If nothing changes, this will only worsen as class sizes increase in the coming years.

// We've built a product that provides students with in-depth feedback on their assignments and their teachers with meaningful findings about them.

// Mission
// Reengage the world's students and teachers

// product slide
//
// differention/competitive advantage slide??
//
// growth/market slide?
