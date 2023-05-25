import { Inngest } from "inngest"

import { env } from "~/env.mjs"

type Events = {
	"app/linkedCourse.created": {
		name: "app/linkedCourse.created"
		data: {
			id: string
			name: string
			creatorAuth: {
				googleAccessToken: string
				googleRefreshToken: string
				googleRefreshTokenExpiresMillis: number
			}
		}
	}
}

const inngest = new Inngest<Events>({
	name: "Understand",
	eventKey: env.INNGEST_EVENT_KEY,
})

export default inngest
