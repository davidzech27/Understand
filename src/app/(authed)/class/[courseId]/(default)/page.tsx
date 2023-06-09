import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import Course from "~/data/Course"
import Card from "~/components/Card"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

interface Params {
	courseId: string
}
// have student feedback activity with links to feedback
const ClassPage = async ({ params: { courseId } }: { params: Params }) => {
	return <Card className="flex flex-1 flex-col py-5 px-6">{null}</Card>
}

export default ClassPage

/*  <div className="text-lg font-medium opacity-60">
		Assignments are being imported from Google Classroom.
		They&apos;ll be found in the &quot;assignments&quot; tab
		when they&apos;re ready
	</div> */
