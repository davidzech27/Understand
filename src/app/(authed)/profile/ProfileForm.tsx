"use client"
import { useRouter } from "next/navigation"

import { type User } from "~/data/User"
import { type School } from "~/data/School"
import updateProfileAction from "./updateProfileAction"
import signOutAction from "./signOutAction"
import Label from "~/components/Label"
import TextInput from "~/components/TextInput"
import * as DropDown from "~/components/DropDown"
import { useState } from "react"
import Avatar from "~/components/Avatar"
import Button from "~/components/Button"

interface Props {
	user: User
	potentialSchools: School[]
}

export default function ProfileForm({ user, potentialSchools }: Props) {
	const [nameInput, setNameInput] = useState(user.name)

	const [schoolName, setSchoolName] = useState<string | undefined>(
		user?.schoolName
	)

	const router = useRouter()

	const changed = nameInput !== user.name || schoolName !== user?.schoolName

	const [savingChanges, setSavingChanges] = useState(false)

	const onSaveChanges = async () => {
		setSavingChanges(true)

		await updateProfileAction({
			name: nameInput,
			school:
				schoolName === user.schoolName
					? undefined
					: potentialSchools.find(
							(potentialSchool) =>
								potentialSchool.name === schoolName
					  ) ?? null,
		})

		router.refresh()

		setSavingChanges(false)
	}

	const [signingOut, setSigningOut] = useState(false)

	const onSignOut = () => {
		setSigningOut(true)

		signOutAction({})
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()

				onSaveChanges()
			}}
			className="flex h-full flex-col gap-2"
		>
			<Label>Name</Label>

			<TextInput
				value={nameInput}
				setValue={setNameInput}
				placeholder="Class name"
				id="name"
				autoFocus
				autoComplete="off"
				className="py-2.5 pl-4 text-base"
			/>

			{potentialSchools.length !== 0 ||
			(user.schoolDistrictName !== undefined &&
				user.schoolName !== undefined) ? (
				<>
					<Label>School</Label>

					<DropDown.Root
						value={schoolName ?? "None of these"}
						setValue={(schoolName) =>
							setSchoolName(
								schoolName === "None of these"
									? undefined
									: schoolName
							)
						}
						items={(user.schoolName !== undefined &&
						potentialSchools.find(
							(school) => school.name === user.schoolName
						) === undefined
							? [
									{ name: user.schoolName } as
										| { name: string }
										| undefined,
							  ]
							: []
						)
							.concat(potentialSchools)
							.concat(undefined)}
						getItemValue={(school) =>
							school?.name ?? "None of these"
						}
						renderItem={(school) => (
							<div className="flex items-center space-x-2 px-4 py-3 font-medium opacity-80">
								{school !== undefined ? (
									<>
										<Avatar
											src={undefined}
											name={school.name}
											fallbackColor="secondary"
											className="h-7 w-7"
										/>

										<DropDown.ItemText>
											{school.name}
										</DropDown.ItemText>
									</>
								) : (
									<DropDown.ItemText>
										None of these
									</DropDown.ItemText>
								)}
							</div>
						)}
						displayValue={schoolName ?? "None of these"}
						id="school"
					/>
				</>
			) : null}

			<div className="flex-1" />

			<Button
				onClick={() => {}}
				size="large"
				disabled={!changed || nameInput === ""}
				loading={savingChanges}
			>
				Save changes
			</Button>

			<Button
				onClick={onSignOut}
				type="button"
				size="large"
				loading={signingOut}
			>
				Sign out
			</Button>
		</form>
	)
}
