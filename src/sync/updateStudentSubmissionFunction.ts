import inngest from "~/background/inngest"
// potentially check GPTZero in the future
const updateStudentSubmission = inngest.createFunction(
	{ name: "Update student submission from Classroom" },
	{ event: "classroom/studentSubmission.updated" },
	async () => {}
)

export default updateStudentSubmission
