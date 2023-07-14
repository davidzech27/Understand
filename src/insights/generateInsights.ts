import callGenerate from "./callGenerate"

export default async function generateInsights({
	courseId,
}: {
	courseId: string
}) {
	await callGenerate({
		name: "course",
		courseId,
		deduplicationId: `insights-${courseId}-${Math.floor(
			new Date().valueOf() / (1000 * 60 * 1)
		)}`,
	})
}
