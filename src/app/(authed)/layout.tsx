import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { getAuthOrThrow } from "~/auth/jwt"
import User from "~/data/User"
import getAuthenticationURL from "~/google/getAuthenticationURL"
import SideBarToggle from "./SideBarToggle"
import SideBarLayoutContainer from "./SideBarLayoutContainer"
import SideBar from "./SideBar"
import TopActions from "./TopActions"
import Card from "~/components/Card"
import Breadcrumbs from "./Breadcrumbs"
import MobileDisclaimer from "./MobileDisclaimer"

export const preferredRegion = "pdx1"

export default async function AuthedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const auth = await getAuthOrThrow({ cookies: cookies() })

	const coursesPromise = Promise.all([
		User({ email: auth.email }).coursesTeaching(),
		User({ email: auth.email }).coursesEnrolled(),
	]).then(([coursesTeaching, coursesEnrolled]) => [
		...coursesTeaching,
		...coursesEnrolled,
	])

	const layout = (
		<>
			<div className="h-screen space-y-2.5 px-3 py-2.5">
				<div className="relative flex h-8 justify-between">
					<div className="flex flex-1 justify-start">
						<SideBarToggle />
					</div>

					<div className="flex flex-1 justify-center">
						<Breadcrumbs coursesPromise={coursesPromise} />
					</div>

					<div className="flex flex-1 justify-end">
						<TopActions schoolRole={auth.school?.role} />
					</div>
				</div>

				<SideBarLayoutContainer
					sideBar={<SideBar />}
					main={
						<Suspense
							fallback={
								<Card className="h-full w-full">{null}</Card>
							}
						>
							{children}
						</Suspense>
					}
					className="h-[calc(100%-32px-10px)]"
				/>
			</div>

			<MobileDisclaimer />
		</>
	)

	const { email, school } = auth

	const user = await User({ email }).get()

	if (user === undefined) redirect("/signIn")

	if (
		user.schoolDistrictName !== school?.districtName ||
		user.schoolName !== school?.name ||
		user.schoolRole !== school?.role
	) {
		redirect(
			getAuthenticationURL({
				redirectTo: "/home",
				scopes: ["https://www.googleapis.com/auth/userinfo.profile"],
			})
		)
	}

	return layout
}
