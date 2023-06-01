"use client"
import { useEffect, useState } from "react"

interface Props {
	date: Date
	prefix?: string
}

const FormattedDate: React.FC<Props> = ({ date, prefix }) => {
	const timeString = `${
		(date.getHours() % 12) + (date.getHours() % 12 === 0 ? 12 : 0)
	}:${date.getMinutes()} ${
		date.getHours() >= 12 && date.getHours() !== 24 ? "PM" : "AM"
	}`

	if (date.getFullYear() === new Date().getFullYear()) {
		return (
			<>
				{prefix}
				{date.toDateString().split(" ").slice(0, 3).join(" ")},{" "}
				{timeString}
			</>
		)
	} else {
		return (
			<>
				{prefix}
				{date.toLocaleDateString() + 1}, {timeString}
			</>
		)
	}
}

export default FormattedDate
