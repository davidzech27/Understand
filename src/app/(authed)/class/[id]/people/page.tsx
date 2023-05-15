import Course from "~/data/Course"

export const metadata = {
	title: "People",
}

interface Params {
	id: string
}

const PeoplePage = async ({ params: { id } }: { params: Params }) => {
	const roster = await Course({ id }).roster()
}

export default PeoplePage
