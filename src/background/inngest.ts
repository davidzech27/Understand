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
	"classroom/roster.updated": {
		name: "classroom/roster.updated"
		data: {
			courseId: string
			email: string
			role: "teacher" | "student"
		}
	}
	"classroom/assignment.created": {
		name: "classroom/assignment.created"
		data: {
			courseId: string
			assignmentId: string
		}
	}
	"classroom/assignment.updated": {
		name: "classroom/assignment.updated"
		data: {
			courseId: string
			assignmentId: string
		}
	}
	"classroom/assignment.deleted": {
		name: "classroom/assignment.deleted"
		data: {
			courseId: string
			assignmentId: string
		}
	}
	"classroom/studentSubmission.updated": {
		name: "classroom/studentSubmission.updated"
		data: {
			courseId: string
			assignmentId: string
			id: string
		}
	}
}

const inngest = new Inngest<Events>({
	name: "Understand",
	eventKey: env.INNGEST_EVENT_KEY,
})

export default inngest
