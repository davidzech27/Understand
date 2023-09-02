import { useEffect, useState, useRef } from "react"
import { useFocusWithin, useHover } from "react-aria"
import { motion, type HTMLMotionProps } from "framer-motion"

import cn from "~/utils/cn"
import TextArea from "~/components/TextArea"

type Props = HTMLMotionProps<"div"> & {
	content: string
	followUps?: string[]
	input?: {
		show: boolean
		focused: boolean
		onSubmit: (input: string) => void
		suggestedInputs?: string[]
		placeholder: string
		disabled?: boolean
	}
	onChangeMouseState: ({
		focusWithin,
		hover,
	}: {
		focusWithin: boolean
		hover: boolean
	}) => void
	onClick: () => void
}

export default function FeedbackCard({
	content,
	followUps = [],
	input,
	onChangeMouseState,
	onClick,
	className,
	...props
}: Props) {
	const [focusWithin, setFocusWithin] = useState(false)

	const { focusWithinProps } = useFocusWithin({
		onFocusWithinChange: (isFocusWithin) => {
			setFocusWithin(isFocusWithin)

			onChangeMouseState({ focusWithin: isFocusWithin, hover: isHovered })

			setInteracted(true)
		},
	})

	const { hoverProps, isHovered } = useHover({
		onHoverChange: (isHovering) => {
			onChangeMouseState({ focusWithin, hover: isHovering })

			setInteracted(true)
		},
	})

	const [inputText, setInputText] = useState("")

	const inputRef = useRef<HTMLTextAreaElement>(null)

	const inputContainerRef = useRef<HTMLDivElement>(null)

	const [inputContainerHeight, setInputContainerHeight] = useState(0)

	useEffect(() => {
		const inputContainerDiv = inputContainerRef.current

		if (inputContainerDiv !== null) {
			const resizeObserver = new ResizeObserver(
				([entry]) =>
					entry?.contentRect.height &&
					setInputContainerHeight(entry.contentRect.height)
			)

			resizeObserver.observe(inputContainerDiv)

			return () => {
				resizeObserver.unobserve(inputContainerDiv)
			}
		}
	}, [])

	useEffect(() => {
		if (input?.focused) inputRef.current?.focus()
	}, [input?.focused])

	const scrollerRef = useRef<HTMLDivElement>(null)

	const [interacted, setInteracted] = useState(false)

	useEffect(() => {
		if (
			scrollerRef.current !== null &&
			Math.abs(
				scrollerRef.current.scrollHeight -
					scrollerRef.current.scrollTop -
					scrollerRef.current.clientHeight
			) < 50 &&
			interacted
		) {
			scrollerRef.current?.scroll({
				top: scrollerRef.current.scrollHeight,
			})
		}
	}, [content, interacted])

	useEffect(() => {
		scrollerRef.current?.scroll({
			top: scrollerRef.current.scrollHeight,
		})
	}, [followUps.length])

	useEffect(() => {
		if (
			scrollerRef.current !== null &&
			Math.abs(
				scrollerRef.current.scrollHeight -
					scrollerRef.current.scrollTop -
					scrollerRef.current.clientHeight
			) < 50
		) {
			scrollerRef.current?.scroll({
				top: scrollerRef.current.scrollHeight,
			})
		}
	}, [followUps])

	const pressedAt = useRef<Date | undefined>(undefined)

	const onPress = () => {
		pressedAt.current = new Date()
	}

	const onUnpress = () => {
		if (new Date().valueOf() - (pressedAt.current?.valueOf() ?? 0) < 200)
			onClick()
	}

	return (
		<motion.div
			{...props}
			{...(focusWithinProps as HTMLMotionProps<"div">)}
			{...(hoverProps as HTMLMotionProps<"div">)}
			onMouseDown={onPress}
			onTouchStart={onPress}
			onMouseUp={onUnpress}
			onTouchEnd={onUnpress}
			transition={{
				type: "tween",
				ease: "easeOut",
				duration: 0.4,
			}}
			className={cn(
				"group flex flex-col rounded-md border border-border bg-surface shadow-sm shadow-[#E5E5E5] transition-shadow duration-500",
				className
					?.split(" ")
					.filter((className) => className.search(/(^|-)h-/g) === -1)
			)}
		>
			<div
				ref={scrollerRef}
				className={cn(
					"overflow-y-scroll overscroll-none",
					className
						?.split(" ")
						.filter(
							(className) => className.search(/(^|-)h-/g) !== -1
						)
				)}
			>
				<div className="px-3 py-2">
					<p className="select-text whitespace-pre-line text-black/80">
						{content}
					</p>
				</div>

				{followUps.map((followUp, index) => (
					<div
						key={index}
						className="border-t border-border px-3 py-2 odd:text-black/80 even:font-medium even:text-black/40"
					>
						<p className="select-text whitespace-pre-line">
							{followUp}
						</p>
					</div>
				))}
			</div>

			{input !== undefined && (
				<div
					style={{
						height: input.show ? inputContainerHeight + 9 : 0,
					}}
					className={cn(
						"overflow-hidden rounded-b-md bg-surface-hover transition-all",
						!input.show && "delay-150"
					)}
				>
					<div
						ref={inputContainerRef}
						className="border-t border-border p-1"
					>
						{input.suggestedInputs && inputText === "" && (
							<div className="mb-1 flex flex-wrap gap-1">
								{input.suggestedInputs.map(
									(suggestedInput, index) => (
										<button
											key={index}
											onMouseDown={() =>
												setInputText(suggestedInput)
											}
											onTouchStart={() =>
												setInputText(suggestedInput)
											}
											onKeyDown={(e) =>
												e.code === "Space" &&
												setInputText(suggestedInput)
											}
											className="rounded-md border border-border bg-surface py-1.5 px-3 text-base text-black/80 transition hover:bg-surface-hover focus-visible:bg-surface-hover active:bg-surface-hover"
										>
											{suggestedInput}
										</button>
									)
								)}
							</div>
						)}

						<TextArea
							value={inputText}
							setValue={setInputText}
							placeholder={input.placeholder}
							onEnter={() => {
								if (input.disabled) return

								input.onSubmit(inputText)

								setInputText("")
							}}
							autoComplete="off"
							ref={inputRef}
							className="py-1.5 px-3 text-base text-black/80"
						/>
					</div>
				</div>
			)}
		</motion.div>
	)
}
