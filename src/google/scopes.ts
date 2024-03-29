const scopes = [
	"https://www.googleapis.com/auth/userinfo.email", // basic profile info
	"https://www.googleapis.com/auth/userinfo.profile", // basic profile info
	"https://www.googleapis.com/auth/classroom.courses.readonly", // used to import Google Classroom courses
	"https://www.googleapis.com/auth/classroom.rosters.readonly", // used to import Google Classroom roster
	"https://www.googleapis.com/auth/classroom.profile.emails", // used to import Google Classroom roster
	"https://www.googleapis.com/auth/classroom.student-submissions.students.readonly", // used to import Google Classroom assignments
	"https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly", // used to import materials
	"https://www.googleapis.com/auth/drive.readonly", // used to get the text of the assignments and attachments in a Google Classroom class or a student's Google Classroom assignment submission
] as const

export default scopes

export type Scope = {
	[K in keyof typeof scopes]: (typeof scopes)[K]
}[number]
