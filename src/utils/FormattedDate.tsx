"use client"
import { useEffect, useState } from "react"

interface Props {
	date: Date
	prefix?: string
}

const FormattedDate: React.FC<Props> = ({ date, prefix }) => {
	const [formattedDate, setFormattedDate] = useState<string | null>(null)
	console.log(date.getHours())
	useEffect(() => {
		const timeString = `${
			((date.getHours() + 1) % 12) - 1 + (date.getHours() >= 12 ? 12 : 0)
		}:${date.getMinutes()} ${
			date.getHours() >= 12 && date.getHours() !== 24 ? "PM" : "AM"
		}`

		if (date.getFullYear() === new Date().getFullYear()) {
			setFormattedDate(
				`${date
					.toDateString()
					.split(" ")
					.slice(0, 3)
					.join(" ")}, ${timeString}`
			)
		} else {
			setFormattedDate(`${date.toDateString() + 1}, ${timeString}`)
		}
	}, [date])

	return formattedDate !== null ? (
		<>
			{prefix}
			{formattedDate}
		</>
	) : null
}

export default FormattedDate
