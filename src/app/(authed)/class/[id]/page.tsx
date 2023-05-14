import Course from "~/data/Course"

export const runtime = "edge"

export const generateMetadata = async ({
	params: { id },
}: {
	params: { id: string }
}) => {
	return {
		title: (await Course({ id }).get())?.name,
	}
}

const ClassPage = async () => {
	return <div className=""></div>
}

export default ClassPage
