import fetchOpenAIStream from "./fetchOpenAIStream"

const getInsights = async ({
	instructions,
	submission,
	specificFeedback,
	generalFeedback,
}: {
	instructions: string
	submission: string
	specificFeedback: string
	generalFeedback: string
}) => {
	const completion = await new Promise<string>((res) =>
		fetchOpenAIStream({
			messages: [
				{
					role: "system",
					content:
						"You are an uncommonly friendly and creative teacher's assistant.",
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

Provide the student's teacher with a few statements about the student in general using the following format:
Type: {strength/weakness}
Paragraph number: {paragraph number(s) for every paragraph where strength/weakness can be found, or -1 if it applies to student's entire work}
Content: {the statement about the student in general. If it is a weakness, hypothesize as to where and why the student's understanding falters.}

Use a numbered list. Begin.`,
				},
			],
			model: "gpt-4",
			presencePenalty: 0,
			frequencyPenalty: 0,
			temperature: 0,
			onContent: () => {},
			onFinish: res,
		})
	)

	console.log("Insights: ", completion)

	return completion
		.split("\n\n")
		.map((insight) => ({
			type:
				insight
					.match(/(?<=^(Insights:[ ]+)?\d\.[ ]Type:[ ]).+/g)?.[0]
					.toLowerCase() === "strength"
					? ("strength" as const)
					: ("weakness" as const),
			paragraphs: insight
				.match(/(?<=\nParagraph number:[ ]).+/g)?.[0]
				.split(", ")
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
		.filter(Boolean)
}

export default getInsights
