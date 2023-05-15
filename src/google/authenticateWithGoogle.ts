import redirectToCookieKey from "../auth/redirectToCookieKey"
import redirectURL from "~/google/redirectURL"
import { type Scope } from "~/google/scopes"
import { env } from "~/env.mjs"

const authenticateWithGoogle = async ({
	scopes,
	redirectTo,
}: {
	scopes: Scope[]
	redirectTo: string
}) => {
	if (redirectTo[0] === "/")
		redirectTo = `${env.NEXT_PUBLIC_URL}${redirectTo}`

	document.cookie = `${redirectToCookieKey}=${redirectTo}`

	window.location.href = encodeURI(
		`https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${scopes.join(
			" "
		)}&prompt=consent&include_granted_scopes=true&response_type=code&client_id=${
			env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
		}&redirect_uri=${redirectURL}`
	)
}

export default authenticateWithGoogle