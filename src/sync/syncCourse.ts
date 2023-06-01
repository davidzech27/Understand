import callSync from "./callSync"

const syncCourse = async ({ id }: { id: string }) => {
	await Promise.all([
		callSync({
			name: "roster",
			courseId: id,
			deduplicationId: `roster-${id}-${Math.floor(
				new Date().valueOf() / (1000 * 60 * 5)
			)}`,
		}),
		callSync({
			name: "resources",
			courseId: id,
			deduplicationId: `resources-${id}-${Math.floor(
				new Date().valueOf() / (1000 * 60 * 5)
			)}`,
		}),
	])
}

export default syncCourse
