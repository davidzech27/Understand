"use server"
import { cookies } from "next/headers"
import { zact } from "zact/server"
import { z } from "zod"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"

const joinCourseAction = zact(z.object({ inviteCode: z.string() }))(
	async ({ inviteCode }) => {
		const { email } = await getAuthOrThrow({ cookies: cookies() })

		return await User({ email }).useInviteCode({ inviteCode })
	}
)

export default joinCourseAction
