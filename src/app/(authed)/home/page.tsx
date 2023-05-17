import { cookies } from "next/headers"

import Card from "~/components/Card"
import User from "~/data/User"
import { getAuthOrThrow } from "~/auth/jwt"

export const runtime = "edge"

export const metadata = {
	title: "Home",
}

const HomePage = async () => {
	const courses = await getAuthOrThrow({ cookies: cookies() }).then(
		({ email }) => User({ email }).courses()
	)

	return (
		<Card className="-mr-2 flex h-full flex-col justify-between overflow-y-scroll border shadow-lg">
			<div className="py-5 px-6">
				{courses.teaching.length === 0 &&
				courses.enrolled.length === 0 ? (
					<>
						<span className="italic opacity-60">
							Home view coming soon...
						</span>
					</>
				) : (
					<span className="italic opacity-60">
						Home view coming soon...
					</span>
				)}
			</div>
		</Card>
	)
}

export default HomePage
