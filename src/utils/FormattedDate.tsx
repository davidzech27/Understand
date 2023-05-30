"use client"
import { useEffect, useState } from "react"

interface Props {
	date: Date
	prefix?: string
}

const FormattedDate: React.FC<Props> = ({ date: dateUTC, prefix }) => {
	const [formattedDate, setFormattedDate] = useState<string | null>(null)

	useEffect(() => {
		const dateLocale = new Date(
			dateUTC.getTime() + new Date().getTimezoneOffset() * 60 * 1000
		)

		const timeString = `${
			(dateLocale.getHours() % 12) +
			(dateLocale.getHours() % 12 === 0 ? 12 : 0)
		}:${dateLocale.getMinutes()} ${
			dateLocale.getHours() >= 12 && dateLocale.getHours() !== 24
				? "PM"
				: "AM"
		}`

		if (dateLocale.getFullYear() === new Date().getFullYear()) {
			setFormattedDate(
				`${dateLocale
					.toDateString()
					.split(" ")
					.slice(0, 3)
					.join(" ")}, ${timeString}`
			)
		} else {
			setFormattedDate(
				`${dateLocale.toLocaleDateString() + 1}, ${timeString}`
			)
		}
	}, [dateUTC])

	return formattedDate !== null ? (
		<>
			{prefix}
			{formattedDate}
		</>
	) : null
}

export default FormattedDate
