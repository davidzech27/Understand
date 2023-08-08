"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePostHog } from "posthog-js/react"

import updateNameAction from "./updateNameAction"
import useSignedIn from "~/utils/useSignedIn"
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

	const { setSignedIn } = useSignedIn()

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

		setSignedIn(true)

		await updateNameAction({ name: nameInput.trim() })

		router.push("/home")
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()

				onGo()
			}}
			className="flex flex-col"
		>
			<div className="flex-[0.875]" />

			<div className="w-full text-center">
				<label
					htmlFor="name"
					className="text-3xl font-medium leading-none opacity-80"
				>
					What name would you like to go by?
				</label>

				{profile === undefined ? (
					<TextInput
						value={nameInput}
						setValue={setNameInput}
						placeholder=""
						id="name"
						autoFocus
						autoComplete="name"
						className="my-8 flex h-12 flex-col space-y-4 text-lg"
					/>
				) : (
					<TextInput
						value={nameInput}
						setValue={setNameInput}
						placeholder="Your name"
						id="name"
						autoFocus
						autoComplete="name"
						className="my-8 flex h-12 flex-col space-y-4 text-lg"
					/>
				)}
			</div>

			<FancyButton
				size="large"
				type="submit"
				disabled={nameInput.length === 0}
				loading={going}
			>
				Let&apos;s go
			</FancyButton>

			<div className="flex-1" />
		</form>
	)
}
