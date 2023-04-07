// consider changing later
const formatDate = (date: Date) => {
	const timeString = `${
		((date.getHours() + 1) % 12) - 1 + (date.getHours() >= 12 ? 12 : 0)
	}:${date.getMinutes()} ${
		date.getHours() >= 12 && date.getHours() !== 24 ? "PM" : "AM"
	}`;

	if (date.getFullYear() === new Date().getFullYear()) {
		return `${date
			.toDateString()
			.split(" ")
			.slice(0, 3)
			.join(" ")}, ${timeString}`;
	} else {
		return `${date.toDateString() + 1}, ${timeString}`;
	}
};

export default formatDate;
