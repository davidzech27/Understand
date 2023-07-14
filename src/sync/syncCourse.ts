import callSync from "./callSync"

export default async function syncCourse({ id }: { id: string }) {
	await Promise.all([
		callSync({
			name: "roster",
			courseId: id,
			deduplicationId: `roster-${id}-${Math.floor(
				new Date().valueOf() / (1000 * 60 * 1)
			)}`,
		}),
		callSync({
			name: "resources",
			courseId: id,
			deduplicationId: `resources-${id}-${Math.floor(
				new Date().valueOf() / (1000 * 60 * 1)
			)}`,
		}),
	])
}
