"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"

const updateProfileAction = zact(
	z.object({
		name: z.string().min(1),
		school: z
			.object({
				districtName: z.string(),
				name: z.string(),
			})
			.optional(),
	})
)(async ({ name, school }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	let newSchool:
		| {
				districtName: string
				name: string
				role: "teacher" | "student" | undefined
		  }
		| undefined = undefined

	if (school !== undefined) {
		const potentialSchools = await User({ email }).potentialSchools()

		newSchool = potentialSchools.find(
			(potentialSchool) =>
				potentialSchool.districtName === school.districtName &&
				potentialSchool.name === school.name
		)
	}

	await User({ email }).update({
		name,
		schoolDistrictName: newSchool?.districtName ?? null,
		schoolName: newSchool?.name ?? null,
		schoolRole: newSchool?.role ?? null,
	})
})

export default updateProfileAction
