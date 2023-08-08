import { cookies } from "next/headers"

export function getSignedIn() {
	return cookies().get("signedIn")?.value === "true"
}
