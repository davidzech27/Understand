"use client"
import { useState, useTransition, use } from "react"
import { useRouter } from "next/navigation"
import { H } from "highlight.run"
import * as Form from "@radix-ui/react-form"
import { useZact } from "zact/client"

import TextInput from "~/components/TextInput"
import FancyButton from "~/components/FancyButton"
import updateNameAction from "./updateNameAction"

type Props =
	| {
			profilePromise: Promise<{
				email: string
				name: string
				photo?: string
			}>
	  }
	| { loading: true }

const LandingForm: React.FC<Props> = (props) => {
	const loading = "loading" in props

	const profile = loading ? undefined : use(props.profilePromise)

	const [nameInput, setNameInput] = useState(profile?.name ?? "")

	const { mutate: updateName, isLoading: isUpdatingName } =
		useZact(updateNameAction)

	const router = useRouter()

	const onGo = () => {
		if (!profile) return

		updateName({ name: nameInput })

		H.identify(profile.email, {
			name: nameInput,
			...(profile.photo ? { avatar: profile.photo } : {}),
		})

		localStorage.setItem("hightlight-identified", "true") // weird system but probably just a temporary measure

		router.push("/home")
	}

	return (
		<Form.Root
			onSubmit={(e) => {
				e.preventDefault()

				onGo()
			}}
			className="flex flex-col"
		>
			<div className="flex-[0.875]" />

			<Form.Field className="w-full text-center" name="name">
				<Form.Label className="text-3xl font-medium leading-none opacity-80">
					What name would you like to go by?
				</Form.Label>

				<Form.Control
					asChild
					className="my-8 flex h-12 flex-col space-y-4"
				>
					{loading ? (
						<TextInput value="" setValue={() => {}} />
					) : (
						<TextInput
							value={nameInput}
							setValue={setNameInput}
							placeholder="Your name"
							autoFocus
						/>
					)}
				</Form.Control>
			</Form.Field>

			<Form.Submit asChild>
				<div>
					<FancyButton
						disabled={!loading && nameInput.length === 0}
						loading={isUpdatingName}
						className="h-20 text-3xl"
					>
						Let&apos;s go
					</FancyButton>
				</div>
			</Form.Submit>

			<div className="flex-1" />
		</Form.Root>
	)
}

export default LandingForm
