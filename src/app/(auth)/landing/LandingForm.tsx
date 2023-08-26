"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import updateProfileAction from "./updateProfileAction"
import cn from "~/utils/cn"
import useSignedIn from "~/utils/useSignedIn"
import TextInput from "~/components/TextInput"
import FancyButton from "~/components/FancyButton"
import Button from "~/components/Button"

interface Props {
	userPromise: Promise<{
		email: string
		name: string
		photo?: string
	}>
	potentialSchoolsPromise: Promise<
		{
			districtName: string
			name: string
			role: "teacher" | "student" | undefined
		}[]
	>
	className?: string
}

export default function LandingForm({
	userPromise,
	potentialSchoolsPromise,
	className,
}: Props) {
	const [screen, setScreen] = useState<"name" | "school">("name")

	const [user, setUser] = useState<Awaited<typeof userPromise>>()

	useEffect(() => {
		userPromise.then((user) => {
			setUser(user)
			setNameInput(user.name)
		})
	}, [userPromise])

	const [nameInput, setNameInput] = useState("")

	const [potentialSchools, setPotentialSchools] =
		useState<Awaited<typeof potentialSchoolsPromise>>()

	useEffect(() => {
		potentialSchoolsPromise.then((potentialSchools) => {
			setPotentialSchools(potentialSchools)
		})
	}, [potentialSchoolsPromise])

	const [selectedSchool, setSelectedSchool] =
		useState<Exclude<typeof potentialSchools, undefined>[0]>()

	const [schoolButtonClicked, setSchoolButtonClicked] = useState(false)

	const { setSignedIn } = useSignedIn()

	const [going, setGoing] = useState(false)

	const router = useRouter()

	const onGo = async () => {
		if (!user) return

		setGoing(true)

		setSignedIn(true)

		await updateProfileAction({
			name: nameInput.trim(),
			school: selectedSchool && {
				districtName: selectedSchool.districtName,
				name: selectedSchool.name,
			},
		})

		router.refresh()

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
			{
				{
					name: (
						<>
							<label
								htmlFor="name"
								className="select-text text-center text-3xl font-semibold tracking-tight text-black/80 mobile:text-2xl"
							>
								Your name?
							</label>

							<TextInput
								value={nameInput}
								setValue={setNameInput}
								placeholder="Your name"
								id="name"
								autoFocus
								autoComplete="name"
								className="my-8 flex h-12 flex-col space-y-4 text-lg font-semibold"
							/>

							<FancyButton
								onClick={() => setScreen("school")}
								size="large"
								type="button"
								disabled={nameInput.length === 0}
							>
								Continue
							</FancyButton>
						</>
					),
					school: (
						<>
							{potentialSchools ===
							undefined ? null : potentialSchools.length === 1 &&
							  potentialSchools[0] !== undefined ? (
								<>
									<label
										htmlFor="schools"
										className="select-text text-center text-3xl font-semibold tracking-tight text-black/80 mobile:text-2xl"
									>
										Are you at this school?
									</label>

									<div className="space-y-2.5" id="school">
										<Button
											key={potentialSchools[0].districtName.concat(
												potentialSchools[0].name
											)}
											onClick={() => {
												setSelectedSchool(
													potentialSchools[0]
												)

												setSchoolButtonClicked(true)
											}}
											size="large"
											type="button"
											disabled={
												selectedSchool ===
												potentialSchools[0]
											}
											className="mobile:whitespace-normal mobile:text-xl"
										>
											{potentialSchools[0].name}
										</Button>

										<Button
											onClick={() => {
												setSelectedSchool(undefined)

												setSchoolButtonClicked(true)
											}}
											size="large"
											type="button"
											disabled={
												schoolButtonClicked &&
												selectedSchool === undefined
											}
											className="mobile:whitespace-normal mobile:text-xl"
										>
											No
										</Button>
									</div>
								</>
							) : (
								<>
									<label
										htmlFor="school"
										className="select-text text-center text-3xl font-semibold tracking-tight text-black/80 mobile:text-2xl"
									>
										Which school are you at?
									</label>

									<div className="space-y-2.5" id="school">
										{potentialSchools?.map((school) => (
											<Button
												key={school.districtName.concat(
													school.name
												)}
												onClick={() => {
													setSelectedSchool(school)

													setSchoolButtonClicked(true)
												}}
												size="large"
												type="button"
												disabled={
													selectedSchool === school
												}
												className="mobile:whitespace-normal mobile:text-xl"
											>
												{school.name}
											</Button>
										))}

										<Button
											onClick={() => {
												setSelectedSchool(undefined)

												setSchoolButtonClicked(true)
											}}
											size="large"
											type="button"
											disabled={
												schoolButtonClicked &&
												selectedSchool === undefined
											}
											className="mobile:whitespace-normal mobile:text-xl"
										>
											None of these
										</Button>
									</div>
								</>
							)}

							<FancyButton
								size="large"
								type="submit"
								disabled={!schoolButtonClicked}
								loading={going}
							>
								Let&apos;s go
							</FancyButton>
						</>
					),
				}[screen]
			}
		</form>
	)
}
