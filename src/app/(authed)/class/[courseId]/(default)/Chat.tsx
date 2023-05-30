"use client"
import { useState } from "react"
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

	const onSend = async () => {
		if (disabled) return

		setMessages((messages) => [...messages, messageInput])

		const newMessages = [...messages, messageInput]

		setMessageInput("")

		setGenerating(true)

		const similarResources = await getSimilarResourcesAction({
			courseId,
			similarText: messageInput,
		})

		fetchOpenAIStream({
			messages: [
				{
					role: "system",
					content: "You are helpful, conversational, and engaging.",
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

Using this information, respond to the ${role} in that class in the conversation that follows. Reference details about specific assignments and documents. If you can't find information on a particular topic, be transparent about it and ask for more context to aid you in your search for relevant information. It is absolutely imperative that you do not assist in plagiarism, so refuse to partake in anything resembling plagiarism. Here's the ${role}'s first message:

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
			},
			onFinish: () => {
				setGenerating(false)
			},
		})
	}

	return (
		<div className="flex h-full flex-col justify-between rounded-md border-[0.75px] border-border bg-surface-hover p-3">
			<div className="flex h-full flex-col space-y-1 overflow-y-scroll">
				{messages.map((message, index) => (
					<div
						key={index}
						className="group rounded-md border-[0.75px] border-border bg-surface px-3 py-2"
					>
						<p className="select-text group-odd:font-medium group-odd:opacity-50">
							{message}
						</p>
					</div>
				))}
			</div>

			<div className="relative">
				<TextArea
					value={messageInput}
					setValue={setMessageInput}
					onEnter={onSend}
					autoFocus
					placeholder={
						generating
							? "Generating..."
							: "Ask a question that could be answered by the content in the Google Classroom for this class"
					}
					className="h-min py-2 px-3"
				/>

				<Send
					onClick={onSend}
					size={20}
					aria-disabled={disabled}
					className={cn(
						"absolute bottom-2.5 right-3 cursor-pointer transition-all duration-150",
						!disabled ? "opacity-80 hover:opacity-60" : "opacity-60"
					)}
				/>
			</div>
		</div>
	)
}

export default Chat
