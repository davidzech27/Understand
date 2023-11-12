import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Plus } from "lucide-react"

import cn from "../utils/cn"
import TextInput from "./TextInput"

interface Props {
	values: string[]
	setValues: (updater: string[] | ((values: string[]) => string[])) => void
	singleWord?: boolean
	placeholder?: string
	autoComplete?: string
	className?: string
	textInputClassname?: string
	buttonClassName?: string
	id?: string
	name?: string
}

export default function InputList({
	values,
	setValues,
	singleWord = false,
	placeholder,
	autoComplete,
	className,
	textInputClassname,
	buttonClassName,
	id,
	name,
}: Props) {
	const wordsSplit = useRef(false)

	useEffect(() => {
		if (singleWord) {
			if (!wordsSplit.current) {
				setValues((values) =>
					values.map((value) => value.split(" ")).flat(),
				)

				wordsSplit.current = true
			} else {
				wordsSplit.current = false
			}
		}
	}, [values, setValues, wordsSplit, singleWord])

	const lastInputRef = useRef<HTMLInputElement>(null)

	const [previousValuesLength, setPreviousValuesLength] = useState(
		values.length,
	)

	if (previousValuesLength !== values.length) {
		flushSync(() => {
			setPreviousValuesLength(values.length)
		})

		lastInputRef.current?.focus()
	}

	return (
		<div
			className={cn(
				"flex h-full w-full flex-wrap gap-x-3 gap-y-2.5",
				className,
			)}
		>
			{values.map((value, index) => (
				<TextInput
					key={index}
					value={value}
					setValue={(value) =>
						setValues((values) => [
							...values.slice(0, index),
							value,
							...values.slice(index + 1),
						])
					}
					autoComplete={autoComplete}
					id={id}
					name={name}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault()

							setValues((values) => [...values, ""])
						}

						if (e.key === "Backspace" && value === "") {
							setValues((values) => [
								...values.slice(0, index),
								...values.slice(index + 1),
							])
						}
					}}
					onFocus={(e) => e.target.select()}
					placeholder={placeholder}
					className={textInputClassname}
					ref={index === values.length - 1 ? lastInputRef : null}
				/>
			))}

			<button
				onClick={(e) => {
					e.preventDefault()

					setValues((values) => [...values, ""])
				}}
				className={cn(
					"flex items-center justify-center self-center rounded-md border-[0.75px] border-border bg-surface outline-none transition-all duration-150 hover:border-[1px] hover:bg-surface-hover focus-visible:border-[1px] focus-visible:bg-surface-hover",
					buttonClassName,
				)} // using an active selector might not be maintaining stylistic consistency
			>
				<Plus size={24} color="black" className="opacity-90" />
			</button>
		</div>
	)
}
