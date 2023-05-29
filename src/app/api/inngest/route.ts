import { serve } from "inngest/next"

import inngest from "~/background/inngest"
import indexClassroomContent from "~/sync/indexClassroomContentFunction"
import createAssignment from "~/sync/createAssignmentFunction"
import updateAssignment from "~/sync/updateAssignmentFunction"
import deleteAssignment from "~/sync/deleteAssignmentFunction"
import updateStudentSubmission from "~/sync/updateStudentSubmissionFunction"
import updateRoster from "~/sync/updateRosterFunction"
import resubscribeToPushNotifications from "~/sync/resubscribeToPushNotificationsFunction"

export const runtime = "edge"

export const { GET, POST, PUT } = serve(
	inngest,
	[
		indexClassroomContent,
		createAssignment,
		updateAssignment,
		deleteAssignment,
		updateStudentSubmission,
		updateRoster,
		resubscribeToPushNotifications,
	],
	{
		streaming: "allow",
	}
)
