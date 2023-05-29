import inngest from "~/background/inngest"
import Assignment from "~/data/Assignment"

const deleteAssignment = inngest.createFunction(
	{ name: "Delete assignment of classroom course" },
	{ event: "classroom/assignment.deleted" },
	async ({
		event: {
			data: { courseId, assignmentId },
		},
	}) => {
		await Assignment({ courseId, assignmentId }).delete()
	}
)

export default deleteAssignment
