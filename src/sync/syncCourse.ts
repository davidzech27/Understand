import callSync from "./callSync"

const syncCourse = async ({ id }: { id: string }) => {
	await Promise.all([
		callSync({
			name: "roster",
			courseId: id,
			deduplicationId: `roster-${Math.floor(
				new Date().valueOf() / (1000 * 60 * 5)
			)}`,
		}),
		callSync({
			name: "resources",
			courseId: id,
			// deduplicationId: `resources-${Math.floor(
			// 	new Date().valueOf() / (1000 * 60 * 5)
			// )}`,
		}),
	])
}

export default syncCourse
