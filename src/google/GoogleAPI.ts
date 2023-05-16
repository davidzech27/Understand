import { z } from "zod"

import { getCredentialsFromRefreshToken } from "./credentials"

const profileSchema = z.object({
	email: z.string().email(),
	name: z.string(),
	photo: z.string().url().optional(),
})

const courseSchema = z.object({
	id: z.string(),
	name: z.string(),
	section: z.string().optional(),
	url: z.string().url(),
})

const courseListSchema = courseSchema.array()

const teacherSchema = z.object({
	email: z.string().optional(),
	name: z.string(),
	photo: z.string().optional(),
})

const studentSchema = z.object({
	email: z.string(),
	name: z.string(),
	photo: z.string().optional(),
})

const rosterSchema = z.object({
	teachers: teacherSchema.array(),
	students: studentSchema.array(),
})

const GoogleAPI = async ({
	accessToken,
	refreshToken,
	expiresMillis,
	onRefreshAccessToken,
}: {
	accessToken: string
	refreshToken: string
	expiresMillis: number
	onRefreshAccessToken: ({}: {
		accessToken: string
		expiresMillis: number
	}) => void
}) => {
	if (expiresMillis < new Date().valueOf()) {
		const credentials = await getCredentialsFromRefreshToken(refreshToken)

		accessToken = credentials.accessToken

		expiresMillis = credentials.expiresMillis

		onRefreshAccessToken &&
			onRefreshAccessToken({ accessToken, expiresMillis })
	}

	return {
		me: async () => {
			const { emailAddresses, names, photos } = (await (
				await fetch(
					"https://people.googleapis.com/v1/people/me?personFields=emailAddresses,names,photos",
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as {
				emailAddresses?: { value: string }[]
				names?: { displayName: string }[]
				photos?: { url: string }[]
			}

			const email = emailAddresses?.[0]?.value

			const name = names?.[0]?.displayName

			const photo = photos?.[0]?.url

			return profileSchema.parse({ email, name, photo })
		},
		coursesTeaching: async () => {
			const { courses } = (await (
				await fetch(
					"https://classroom.googleapis.com/v1/courses?teacherId=me&courseStates=ACTIVE",
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as { courses: (unknown & { alternateLink: unknown })[] }

			return courseListSchema.parse(
				courses.map((course) => ({
					...course,
					url: course.alternateLink,
				}))
			)
		},
		coursesEnrolled: async () => {
			const { courses } = (await (
				await fetch(
					"https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE",
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				)
			).json()) as { courses: (unknown & { alternateLink: unknown })[] }

			return courseListSchema.parse(
				courses.map((course) => ({
					...course,
					url: course.alternateLink,
				}))
			)
		},
		courseRoster: async ({ courseId }: { courseId: string }) => {
			const [{ teachers }, { students }] = (await Promise.all([
				fetch(
					`https://classroom.googleapis.com/v1/courses/${courseId}/teachers`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				).then((response) => response.json()),
				fetch(
					`https://classroom.googleapis.com/v1/courses/${courseId}/students`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				).then((response) => response.json()),
			])) as [
				{
					teachers: {
						profile: {
							emailAddress?: string
							name: { fullName: string }
							photoUrl: string
						}
					}[]
				},
				{
					students: {
						profile: {
							emailAddress: string
							name: { fullName: string }
							photoUrl: string
						}
					}[]
				}
			]

			return rosterSchema.parse({
				teachers: teachers.map((teacher) => ({
					email: teacher.profile.emailAddress,
					name: teacher.profile.name.fullName,
					photo: teacher.profile.photoUrl,
				})),
				students: students.map((student) => ({
					email: student.profile.emailAddress,
					name: student.profile.name.fullName,
					photo: student.profile.photoUrl,
				})),
			})
		},
	}
}

export default GoogleAPI
