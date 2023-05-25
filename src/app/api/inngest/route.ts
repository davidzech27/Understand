import { serve } from "inngest/next"

import inngest from "~/background/inngest"
import indexGoogleClassroomContent from "~/app/(authed)/class/create/indexGoogleClassroomContent"

export const runtime = "edge"

export const { GET, POST, PUT } = serve(
	inngest,
	[indexGoogleClassroomContent],
	{
		streaming: "allow",
	}
)
