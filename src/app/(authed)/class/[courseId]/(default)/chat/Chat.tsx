"use client"
import { useRef, useState } from "react"
import { useLogger } from "next-axiom"
import { Send } from "lucide-react"

import { type User } from "~/data/User"
import getSimilarResourcesAction from "./getSimilarResourcesAction"
import cn from "~/utils/cn"
import fetchOpenAI from "~/ai/fetchOpenAI"
import FeatureBlockModal from "~/limits/FeatureBlockModal"
import RateLimitModal from "~/limits/RateLimitModal"
import TextArea from "~/components/TextArea"

interface Props {
	courseId: string
	courseName: string
	courseHasResources: boolean
	user: User
	role: "teacher" | "student"
}

export default function Chat({
	courseId,
	courseName,
	courseHasResources,
	user,
	role,
}: Props) {
	const [messageInput, setMessageInput] = useState("")

	const [messages, setMessages] = useState<string[]>([])

	const [generating, setGenerating] = useState(false)

	const disabled = messageInput.length === 0 || generating

	const scrollerRef = useRef<HTMLDivElement>(null)

	const [featureBlockModalOpen, setFeatureBlockModalOpen] = useState(false)

	const [rateLimitModalOpen, setRateLimitModalOpen] = useState(false)

	const log = useLogger()

	const onRateLimit = () => {
		setGenerating(false)

		setRateLimitModalOpen(true)
	}

	const onError = (error: Error) => {
		log.error("Chat error", { error })
	}

	const onSend = async () => {
		if (
			user.schoolDistrictName === undefined ||
			user.schoolName === undefined
		)
			return setFeatureBlockModalOpen(true)

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

		if (courseHasResources) {
			fetchOpenAI({
				messages: [
					{
						role: "system",
						content: "You are helpful and descriptive.",
					},
					{
						role: "user",
						content:
							messages.length === 1
								? `${newMessages[0]}

If the above message is requesting your help, respond with something that sounds like it could be content posted by the teacher in the Google Classroom for a class named ${courseName} that would answer it. If it is not requesting your help, respond with "N/A".`
								: `${newMessages.join("\n\n")}

If the above conversation contains a request for your help, respond with something that sounds like it could be content posted by the teacher in the Google Classroom for a class named ${courseName} that would answer it. If there is no request for your help, respond with "N/A".`,
					},
				],
				model: "gpt-3.5-turbo-0613",
				frequencyPenalty: 0,
				presencePenalty: 0,
				temperature: 0,
				maxTokens: 100,
				reason: "chat",
				onContent: () => {},
				onFinish: async (content) => {
					if (content === "N/A") {
						fetchOpenAI({
							messages: [
								{
									role: "system",
									content:
										"You are helpful, conversational, and engaging.",
								},
								{
									role: "user",
									content: `Respond to the ${role} in the conversation that follows. It is absolutely imperative that you do not assist in plagiarism or anything that may resemble it. Here's the ${role}'s first message:

${newMessages[0]}`,
								},
								...newMessages
									.slice(1)
									.map((message, index) => ({
										role:
											index % 2 === 0
												? ("assistant" as const)
												: ("user" as const),
										content: message,
									})),
							],
							model: "gpt-3.5-turbo-16k-0613",
							temperature: 0,
							presencePenalty: 0.25,
							frequencyPenalty: 0.25,
							reason: "chat",
							onContent: (content) => {
								setMessages((messages) => {
									if (messages.length % 2 === 0) {
										return [
											...messages.slice(
												0,
												messages.length - 1
											),
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
							onRateLimit,
							onError,
						})
					} else {
						const similarResources =
							await getSimilarResourcesAction({
								courseId,
								similarText: content,
							})

						fetchOpenAI({
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

Using this information, respond to the ${role} in that class in the conversation that follows. Reference details about specific assignments and documents, covering all their subtleties, while also weaving in your own insights about them. If you can't find information on a particular topic, be transparent about it and ask for more context to aid you in your search for relevant assignments and documents. It is absolutely imperative that you do not assist in plagiarism or anything that may resemble it. Here's the ${role}'s first message:

${newMessages[0]}`,
								},
								...newMessages
									.slice(1)
									.map((message, index) => ({
										role:
											index % 2 === 0
												? ("assistant" as const)
												: ("user" as const),
										content: message,
									})),
							],
							model: "gpt-3.5-turbo-16k-0613",
							temperature: 0,
							presencePenalty: 0.25,
							frequencyPenalty: 0.25,
							reason: "chat",
							onContent: (content) => {
								setMessages((messages) => {
									if (messages.length % 2 === 0) {
										return [
											...messages.slice(
												0,
												messages.length - 1
											),
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
							onRateLimit,
							onError,
						})
					}
				},
				onRateLimit,
				onError,
			})
		} else {
			fetchOpenAI({
				messages: [
					{
						role: "system",
						content:
							"You are helpful, conversational, and engaging.",
					},
					{
						role: "user",
						content: `Respond to a ${role} in a class named ${courseName} in the conversation that follows. It is absolutely imperative that you do not assist in plagiarism or anything that may resemble it. Here's the ${role}'s first message:

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
				model: "gpt-3.5-turbo-16k-0613",
				temperature: 0,
				presencePenalty: 0.25,
				frequencyPenalty: 0.25,
				reason: "chat",
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
				onRateLimit,
				onError,
			})
		}
	}

	return (
		<>
			<FeatureBlockModal
				open={featureBlockModalOpen}
				setOpen={setFeatureBlockModalOpen}
				feature={`use ${role === "teacher" ? "Teacher" : "Student"}GPT`}
			/>

			<RateLimitModal
				open={rateLimitModalOpen}
				setOpen={setRateLimitModalOpen}
			/>

			<div className="relative h-full">
				<div
					ref={scrollerRef}
					className="absolute bottom-0 left-0 right-0 top-0 flex flex-col space-y-1 overflow-y-scroll rounded-md border-[0.75px] border-border bg-surface-hover pb-[57.5px] pl-3 pr-1 pt-3"
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

				<div className="absolute bottom-3 left-3 right-3 backdrop-blur-sm">
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
						autoComplete="off"
						style={{
							height: messageInput.length === 0 ? 42 : "auto",
						}}
						className="px-3 py-2"
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
		</>
	)
}
