import fetchOpenAIStream from "../shared/fetchOpenAIStream";

const getFollowUp = ({
	feedback,
	followUps,
	instructions,
	submission,
	outline,
	commentary,
	specificFeedback,
	generalFeedback,
	onContent,
	onFinish,
}: {
	feedback: string;
	followUps: string[];
	instructions: string;
	submission: string;
	outline: string;
	commentary: string;
	specificFeedback: string;
	generalFeedback: string;
	onContent: (content: string) => void;
	onFinish: (content: string) => void;
}) => {
	fetchOpenAIStream({
		messages: [
			{
				role: "system",
				content:
					"You are uncommonly engaging and insightful. You're incredibly skilled at going into great depth and cover more than just surface level details. You always elaborate on your reasoning in interesting ways in order to help students understand at a deeper level how to improve their work. You enjoy reading the work of students with an interesting writing style. You have an interesting and unique tone.",
			},
			{
				role: "user",
				content: `You have just analyzed a high school student's work and given them feedback on it, and the student has just responded to a part of your feedback. You will respond to them in a way that leads them to a deeper understanding of the subject matter, and should ultimately serve to guide the student to improve their ability to think critically and express their ideas effectively.

Here are some things to keep in mind as you form your responses:
1. Generalize upon the points you make to larger contexts in interesting ways in order to help the student understand the subject matter at a deeper level.
2. Never give any ideas or content away to the student; you could instead cleverly ask them a question or make an insightful comment to lead them in the right direction.
3. You could walk the student through a concrete example of a thought process they could take so that they are able to truly understand how to improve their writing.
4. Rather than suggesting that the student alter their writing choices, focus on elevating the their strengths and reducing their weaknesses.
5. Try to seem human. It's ok to go off on a brief tangent in order to make a point.

ASSIGNMENT PROMPT:
"""""
${instructions}
"""""

STUDENT'S PROGRESS:
"""""
${submission}
"""""

YOUR OUTLINE OF STUDENT'S WORK:
"""""
${outline}
"""""

YOUR ANALYSIS OF STUDENT'S WORK:
"""""
${commentary}
"""""

YOUR FEEDBACK ON SPECIFIC PARTS OF STUDENT'S WORK:
"""""
${specificFeedback}
"""""

YOUR FEEDBACK ON STUDENT'S ENTIRE WORK:
"""""
${generalFeedback}
"""""

THE FEEDBACK THE STUDENT IS RESPONDING TO:
"""""
${feedback}
"""""

Now, here's what they said:`,
			},
			...followUps.map((followUp, index) => ({
				role:
					index % 2 === 0
						? ("user" as const)
						: ("assistant" as const),
				content: followUp,
			})),
		],
		model: "gpt-4",
		temperature: 0.25,
		presencePenalty: 0.5,
		frequencyPenalty: 0.5,
		onContent,
		onFinish,
	});
};

export default getFollowUp;
