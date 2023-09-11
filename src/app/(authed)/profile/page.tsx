import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"
import Card from "~/components/Card"
import ProfileForm from "./ProfileForm"

export const metadata = {
	title: "Home",
}

export const runtime = "edge"

export default async function ProfilePage() {
	const { email } = await getAuthOrThrow({ cookies: cookies() })

	const [user, potentialSchools] = await Promise.all([
		User({ email }).get(),
		User({ email }).potentialSchools(),
	])

	if (user === undefined) notFound()

	return (
		<Card className="flex h-full flex-col justify-between overflow-y-scroll border px-6 py-5 shadow-lg">
			<ProfileForm user={user} potentialSchools={potentialSchools} />
		</Card>
	)
}
