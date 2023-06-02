"use client"
import { useRef, useState } from "react"
import { Send } from "lucide-react"

import getSimilarResourcesAction from "./getSimilarResourcesAction"
import fetchOpenAIStream from "~/ai/fetchOpenAIStream"
import TextArea from "~/components/TextArea"
import cn from "~/utils/cn"

interface Props {
	courseId: string
	courseName: string
	role: "teacher" | "student"
}

const Chat: React.FC<Props> = ({ courseId, courseName, role }) => {
	const [messageInput, setMessageInput] = useState("")

	const [messages, setMessages] = useState<string[]>([])

	const [generating, setGenerating] = useState(false)

	const disabled = messageInput.length === 0 || generating

	const scrollerRef = useRef<HTMLDivElement>(null)

	const onSend = async () => {
		if (disabled) return

		setMessages((messages) => [...messages, messageInput])

		const newMessages = [...messages, messageInput]

		setMessageInput("")

		setGenerating(true)

		setTimeout(() => {
			scrollerRef.current?.scroll({
				top: scrollerRef.current.scrollHeight,
			})
		}, 10)

		fetchOpenAIStream({
			messages: [
				{ role: "system", content: "You are helpful and descriptive." },
				{
					role: "user",
					content:
						messages.length === 1
							? `Respond with something that sounds like it could be content posted by the teacher in the Google Classroom for a class named ${courseName} that would answer the following question:

${newMessages}`
							: `${newMessages.join("\n\n")}

Respond with something that sounds like it could be content posted by the teacher in the Google Classroom for a class named ${courseName} that would answer the final question in the above conversation.`,
				},
			],
			model: "gpt-3.5-turbo",
			frequencyPenalty: 0,
			presencePenalty: 0,
			temperature: 0,
			maxTokens: 100,
			onContent: () => {},
			onFinish: async (content) => {
				console.log("Predicted similar resources: ", content)

				const similarResources = await getSimilarResourcesAction({
					courseId,
					similarText: content,
				})

				console.log("Similar resources: ", similarResources)

				fetchOpenAIStream({
					messages: [
						{
							role: "system",
							content:
								"You are helpful, conversational, and engaging.",
						},
						{
							role: "user",
							content: `The date is ${new Date()
								.toDateString()
								.split(" ")
								.slice(1)
								.join(" ")}.

Here's some relevant content from the Google Classroom of a course named ${courseName}:

${similarResources
	.map((resource, index) => `${index + 1}. ${resource}`)
	.join("\n\n")}

Using this information, respond to the ${role} in that class in the conversation that follows. Reference details about specific assignments and documents, covering all their subtleties, while also weaving in your own insights about them. If you can't find information on a particular topic, be transparent about it and ask for more context to aid you in your search for relevant assignments and documents. It is absolutely imperative that you do not assist in plagiarism, and refuse to plagiarize any work for the ${role}. Here's the ${role}'s first message:

${newMessages[0]}`,
						},
						...newMessages.slice(1).map((message, index) => ({
							role:
								index % 2 === 0
									? ("assistant" as const)
									: ("user" as const),
							content: message,
						})),
					],
					model: "gpt-3.5-turbo",
					temperature: 0,
					presencePenalty: 0.0,
					frequencyPenalty: 0.0,
					onContent: (content) => {
						setMessages((messages) => {
							if (messages.length % 2 === 0) {
								return [
									...messages.slice(0, messages.length - 1),
									content,
								]
							} else {
								return [...messages, content]
							}
						})

						if (
							scrollerRef.current !== null &&
							Math.abs(
								scrollerRef.current.scrollHeight -
									scrollerRef.current.scrollTop -
									scrollerRef.current.clientHeight
							) < 50
						) {
							scrollerRef.current?.scroll({
								top: scrollerRef.current.scrollHeight,
							})
						}
					},
					onFinish: () => {
						setGenerating(false)
					},
				})
			},
		})
	}

	return (
		<div className="relative h-full">
			<div
				ref={scrollerRef}
				className="absolute top-0 left-0 right-0 bottom-0 flex flex-col space-y-1 overflow-y-scroll rounded-md border-[0.75px] border-border bg-surface-hover pl-3 pr-1 pt-3 pb-[57.5px]"
			>
				{messages.map((message, index) => (
					<div
						key={index}
						className="group rounded-md border-[0.75px] border-border bg-surface px-3 py-2"
					>
						<p className="select-text whitespace-pre-line group-odd:font-medium group-odd:opacity-50">
							{message}
						</p>
					</div>
				))}
			</div>

			<div className="absolute right-3 left-3 bottom-3 backdrop-blur-sm">
				<TextArea
					value={messageInput}
					setValue={setMessageInput}
					onEnter={onSend}
					autoFocus
					placeholder={
						generating
							? "Generating..."
							: "Ask a question about the assignments or content in this class"
					}
					style={{ height: messageInput.length === 0 ? 42 : "auto" }}
					className="py-2 px-3"
				/>

				<Send
					onClick={onSend}
					size={20}
					aria-disabled={disabled}
					className={cn(
						"absolute bottom-2.5 right-3 transition-all duration-150",
						!disabled
							? "cursor-pointer opacity-60 hover:opacity-80"
							: "opacity-40"
					)}
				/>
			</div>
		</div>
	)
}

export default Chat
