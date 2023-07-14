"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as Form from "@radix-ui/react-form"
import { usePostHog } from "posthog-js/react"

import updateNameAction from "./updateNameAction"
import TextInput from "~/components/TextInput"
import FancyButton from "~/components/FancyButton"

interface Props {
	profilePromise: Promise<{
		email: string
		name: string
		photo?: string
	}>
}

export default function LandingForm({ profilePromise }: Props) {
	const [profile, setProfile] = useState<{
		email: string
		name: string
		photo?: string
	}>()

	useEffect(() => {
		profilePromise.then((profile) => {
			setProfile(profile)
			setNameInput(profile.name)
		})
	}, [profilePromise])

	const [nameInput, setNameInput] = useState(profile?.name ?? "")

	const [going, setGoing] = useState(false)

	const router = useRouter()

	const posthog = usePostHog()

	const onGo = async () => {
		if (!profile) return

		setGoing(true)

		posthog &&
			posthog.identify(profile.email, {
				email: profile.email,
				name: nameInput.trim(),
				photo: profile.photo,
			})

		await updateNameAction({ name: nameInput.trim() })

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
					{profile === undefined ? (
						<TextInput
							value={nameInput}
							setValue={setNameInput}
							placeholder=""
							autoFocus
							autoComplete="name"
							className="text-lg"
						/>
					) : (
						<TextInput
							value={nameInput}
							setValue={setNameInput}
							placeholder="Your name"
							autoFocus
							autoComplete="name"
							className="text-lg"
						/>
					)}
				</Form.Control>
			</Form.Field>

			<Form.Submit asChild>
				<div>
					<FancyButton
						size="large"
						disabled={nameInput.length === 0}
						loading={going}
					>
						Let&apos;s go
					</FancyButton>
				</div>
			</Form.Submit>

			<div className="flex-1" />
		</Form.Root>
	)
}
