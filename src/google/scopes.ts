const scopes = [
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/userinfo.profile",
	"https://www.googleapis.com/auth/classroom.courses.readonly",
	"https://www.googleapis.com/auth/classroom.rosters.readonly",
	"https://www.googleapis.com/auth/classroom.profile.emails",
	"https://www.googleapis.com/auth/classroom.profile.photos",
] as const

export default scopes

export type Scope = {
	[K in keyof typeof scopes]: (typeof scopes)[K]
}[number]
