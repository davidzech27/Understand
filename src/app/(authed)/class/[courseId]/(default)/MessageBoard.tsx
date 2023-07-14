"use client"
import { useState } from "react"
import * as Form from "@radix-ui/react-form"
import { useZact } from "zact/client"

import TextArea from "~/components/TextArea"
import Avatar from "~/components/Avatar"
import FancyButton from "~/components/FancyButton"
import formatDate from "~/utils/formatDate"
import postMessageAction from "./postMessageAction"

interface Props {
	courseId: string
}

export default function MessageBoard({ courseId }: Props) {
	const [messageInput, setMessageInput] = useState("")

	const {
		mutate: postMessage,
		data: similarMessages,
		isLoading: isPosting,
	} = useZact(postMessageAction)

	const onPost = () => {
		postMessage({ courseId, content: messageInput, limit: 20 })
	}

	return similarMessages === null ? (
		<Form.Root
			onSubmit={(e) => {
				e.preventDefault()

				onPost()
			}}
			className="flex space-x-3"
		>
			<Form.Field asChild name="message-board-input">
				<Form.Control asChild>
					<TextArea
						value={messageInput}
						setValue={setMessageInput}
						placeholder="Post a message to your class and see messages similar to it from your class"
						style={{
							height: messageInput.length === 0 ? 80 : "auto",
						}}
						autoFocus
						autoComplete="off"
						className="min-h-[80px] py-2 px-3"
					/>
				</Form.Control>
			</Form.Field>

			<Form.Submit asChild>
				<FancyButton
					disabled={messageInput.length === 0}
					loading={isPosting}
					size="medium"
					className="h-20 w-80"
				>
					Post message
				</FancyButton>
			</Form.Submit>
		</Form.Root>
	) : (
		<div className="flex flex-col space-y-3">
			{similarMessages.length !== 0 ? (
				similarMessages.map(({ from, content, sentAt }, index) => (
					<div
						key={index}
						className="flex min-h-[80px] select-text items-center rounded-md border-[0.75px] border-border py-4 pl-6 pr-8 transition duration-150 hover:bg-surface-hover"
					>
						<div className="flex flex-1">
							<Avatar
								src={from.email}
								name={from.name}
								fallbackColor="primary"
								className="h-11 w-11 flex-shrink-0 rounded-full"
							/>

							<div className="ml-3 flex flex-col self-center">
								<span className="mb-[2px] font-medium leading-none opacity-90">
									{from.name}
								</span>

								<div className="whitespace-pre-line text-sm opacity-60">
									{content}
								</div>
							</div>
						</div>

						<span className="opacity-60">{formatDate(sentAt)}</span>
					</div>
				))
			) : (
				<div className="text-lg font-medium opacity-60">
					No one else in your class has posted a message yet :(
				</div>
			)}
		</div>
	)
}
