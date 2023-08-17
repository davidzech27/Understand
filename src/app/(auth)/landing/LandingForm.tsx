"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import updateNameAction from "./updateNameAction"
import cn from "~/utils/cn"
import useSignedIn from "~/utils/useSignedIn"
import TextInput from "~/components/TextInput"
import FancyButton from "~/components/FancyButton"

interface Props {
	profilePromise: Promise<{
		email: string
		name: string
		photo?: string
	}>
	className?: string
}

export default function LandingForm({ profilePromise, className }: Props) {
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

	const onGo = async () => {
		if (!profile) return

		setGoing(true)

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
			className={cn("flex flex-col", className)}
		>
			<label
				htmlFor="name"
				className="select-text text-center text-3xl font-semibold tracking-tight text-black/80 mobile:text-2xl"
			>
				Your name?
			</label>

			{profile === undefined ? (
				<TextInput
					value={nameInput}
					setValue={setNameInput}
					placeholder=""
					id="name"
					autoFocus
					autoComplete="name"
					className="my-8 flex h-12 flex-col space-y-4 text-lg font-semibold"
				/>
			) : (
				<TextInput
					value={nameInput}
					setValue={setNameInput}
					placeholder="Your name"
					id="name"
					autoFocus
					autoComplete="name"
					className="my-8 flex h-12 flex-col space-y-4 text-lg font-semibold"
				/>
			)}

			<FancyButton
				size="large"
				type="submit"
				disabled={nameInput.length === 0}
				loading={going}
			>
				Let&apos;s go
			</FancyButton>
		</form>
	)
}
