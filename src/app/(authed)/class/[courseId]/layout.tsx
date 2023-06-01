import syncCourse from "~/sync/syncCourse"

interface Params {
	courseId: string
}

const CourseLayout = async ({
	children,
	params,
}: {
	children: React.ReactNode
	params: Params
}) => {
	void syncCourse({ id: params.courseId })

	return children
}

export default CourseLayout
