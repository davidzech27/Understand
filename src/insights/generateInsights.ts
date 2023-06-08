import callGenerate from "./callGenerate"

const generateInsights = async ({ courseId }: { courseId: string }) => {
	await callGenerate({
		name: "course",
		courseId,
		deduplicationId: `insights-${courseId}-${Math.floor(
			new Date().valueOf() / (1000 * 60 * 1)
		)}`,
	})
}

export default generateInsights
