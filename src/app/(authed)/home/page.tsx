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
		<Card className="flex h-full flex-col justify-between border shadow-lg">
			<div className="py-5 px-6">
				{courses.teaching.length === 0 &&
				courses.enrolled.length === 0 ? (
					<>
						<div className="text-5xl font-medium text-black opacity-80">
							Welcome to Understand!
						</div>

						<div className="mt-2 ml-1 text-xl text-black opacity-60">
							First, either create or join a class
						</div>
					</>
				) : (
					<span className="font-medium italic opacity-60">
						Class overview coming soon...
					</span>
				)}
			</div>
		</Card>
	)
}

export default HomePage
