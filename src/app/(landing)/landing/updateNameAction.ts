"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

const updateNameAction = zact(
	z.object({
		name: z.string().min(1),
	})
)(async ({ name }) => {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	await User({ email }).update({ name })
})

export default updateNameAction
