import fetchOpenAI from "./fetchOpenAI"

export default async function getInsights({
	instructions,
	submission,
	specificFeedback,
	generalFeedback,
}: {
	instructions: string
	submission: string
	specificFeedback: string
	generalFeedback: string
}) {
	const completion = await new Promise<string>((res) =>
		fetchOpenAI({
			messages: [
				{
					role: "system",
					content:
						"You are an uncommonly creative and nuanced teacher's assistant.",
				},
				{
					role: "user",
					content: `The following is a prompt for an assignment in a high school course:
<assignment-prompt>
${instructions}
</assignment-prompt>

The following is a high school student's progress on that assignment:
<student-progress>
${submission}
</student-progress>

The following is feedback provided to the student on specific segments of their work:
<specific-feedback>
${specificFeedback
	.split("\n")
	.filter((line) => !line.startsWith("Sentence number: "))
	.join("\n")}
</specific-feedback>

The following is feedback provided to the student on their entire work:
<general-feedback>
${generalFeedback}
</general-feedback>

Provide the student's teacher with a few statements about the student's understanding of the subject using the following format:
Type: {strength/weakness}
Paragraph number: {paragraph number(s) for every paragraph where strength/weakness could be found, using a comma-separated list if necessary, or -1 if it applies to student's entire work}
Content: {a statement about the student's understanding of the subject. If it is a weakness, hypothesize as to what may have caused this weakness}

Begin.`,
				},
			],
			model: "gpt-4-0613",
			presencePenalty: 0.5,
			frequencyPenalty: 0.5,
			temperature: 0,
			onContent: () => {},
			onFinish: res,
		})
	)

	return {
		insights: completion
			.split("\n\n")
			.map((insight) => ({
				type:
					insight
						.match(/(?<=^(Insights:[ ]+)?Type:[ ]).+/g)?.[0]
						.toLowerCase() === "strength"
						? ("strength" as const)
						: ("weakness" as const),
				paragraphs: insight
					.match(/(?<=\nParagraph number:[ ]).+/g)?.[0]
					.split(/,[ ]*/)
					.map(Number),
				content: insight.match(/(?<=\nContent:[ ]).+/g)?.[0],
			}))
			.map((insight) =>
				insight.paragraphs && insight.content
					? {
							type: insight.type,
							paragraphs: insight.paragraphs,
							content: insight.content,
					  }
					: undefined
			)
			.filter(Boolean),
		rawResponse: completion,
	}
}
