"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import { getAuthOrThrow, setAuth } from "~/auth/jwt"
import User from "~/data/User"

const updateProfileAction = zact(
	z.object({
		name: z.string().min(1),
		school: z
			.object({
				districtName: z.string(),
				name: z.string(),
			})
			.nullish(),
	}),
)(async ({ name, school }) => {
	const auth = await getAuthOrThrow({ cookies: cookies() })

	const { email } = auth

	const newSchool =
		school &&
		(await User({ email }).potentialSchools()).find(
			(potentialSchool) =>
				potentialSchool.districtName === school.districtName &&
				potentialSchool.name === school.name,
		)

	await Promise.all([
		User({ email }).update({
			name,
			...(school !== undefined
				? {
						schoolDistrictName: newSchool?.districtName ?? null,
						schoolName: newSchool?.name ?? null,
						schoolRole: newSchool?.role ?? null,
				  }
				: {}),
		}),
		school !== undefined &&
			setAuth({
				auth: { ...auth, school: newSchool ?? undefined },
				cookies: cookies(),
			}),
	])
})

export default updateProfileAction
