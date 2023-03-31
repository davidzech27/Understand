const scopes = {
	courses: ["https://www.googleapis.com/auth/classroom.courses.readonly"],
	rosters: [
		"https://www.googleapis.com/auth/classroom.rosters.readonly",
		"https://www.googleapis.com/auth/classroom.profile.emails",
		"https://www.googleapis.com/auth/classroom.profile.photos",
	],
	studentAssignments: [
		"https://www.googleapis.com/auth/classroom.coursework.students.readonly",
	],
	selfAssignments: [
		"https://www.googleapis.com/auth/classroom.coursework.me.readonly",
	],
	assignmentAttachments: [
		"https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
	],
	drive: ["https://www.googleapis.com/auth/drive.readonly"],
};

export default async ({
	permissions,
	redirectTo,
}: {
	permissions: (keyof typeof scopes)[];
	redirectTo: string;
}) => {
	const url = await (
		await fetch("/api/authenticate", {
			method: "POST",
			body: JSON.stringify({
				scopes: permissions
					.map((permission) => scopes[permission])
					.flat()
					.join(" "),
				redirectTo,
			}),

			headers: {
				"Content-Type": "application/json",
			},
		})
	).text();

	window.location.href = url;
};
